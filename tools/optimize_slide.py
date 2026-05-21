import cv2
import numpy as np
import sys


def crop_to_content(image):
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 35, 120)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    edges = cv2.dilate(edges, kernel, iterations=1)

    coords = cv2.findNonZero(edges)
    if coords is None:
        return image, False

    x, y, bw, bh = cv2.boundingRect(coords)
    pad = max(10, int(min(h, w) * 0.04))
    x0 = max(0, x - pad)
    y0 = max(0, y - pad)
    x1 = min(w, x + bw + pad)
    y1 = min(h, y + bh + pad)

    cropped = image[y0:y1, x0:x1]
    if cropped.size == 0:
        return image, False

    crop_ratio = (cropped.shape[0] * cropped.shape[1]) / float(h * w)
    if crop_ratio < 0.35 or crop_ratio > 0.98:
        return image, False

    return cropped, True


def optimize_medical_slide(image_path, output_path):
    """
    Optimiza una foto de una diapositiva médica.
    - Intenta rectificar la diapositiva.
    - Recorta bordes sobrantes si el contorno es confiable.
    - Genera zooms del pie de pagina para la IA.
    """
    img = cv2.imread(image_path)
    if img is None:
        return False, "Error de lectura"

    h, w = img.shape[:2]
    total_area = h * w

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.bilateralFilter(gray, 11, 17, 17)

    screen_cnt = None
    for method in ["canny", "thresh"]:
        if method == "canny":
            edged = cv2.Canny(blurred, 30, 150)
        else:
            edged = cv2.adaptiveThreshold(
                blurred,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                11,
                2,
            )
            edged = cv2.bitwise_not(edged)

        cnts, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:15]

        for c in cnts:
            area = cv2.contourArea(c)
            if area < total_area * 0.10:
                continue
            peri = cv2.arcLength(c, True)
            for eps in [0.01, 0.02, 0.03, 0.05]:
                approx = cv2.approxPolyDP(c, eps * peri, True)
                if len(approx) == 4 and cv2.isContourConvex(approx):
                    screen_cnt = approx
                    break
            if screen_cnt is not None:
                break
        if screen_cnt is not None:
            break

    processed = img
    rectified = False

    if screen_cnt is not None:
      try:
        pts = screen_cnt.reshape(4, 2)
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]

        (tl, tr, br, bl) = rect
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        max_width = max(int(widthA), int(widthB))

        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        max_height = max(int(heightA), int(heightB))

        dst = np.array([
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ], dtype="float32")

        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(img, M, (max_width, max_height))

        aspect_ratio = max_width / float(max_height)
        if 0.5 < aspect_ratio < 2.5:
            processed = warped
            rectified = True
      except Exception:
        processed = img

    cropped, was_cropped = crop_to_content(processed)
    if was_cropped:
        processed = cropped

    lab = cv2.cvtColor(processed, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    final = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    gaussian = cv2.GaussianBlur(final, (0, 0), 3.0)
    final = cv2.addWeighted(final, 1.6, gaussian, -0.6, 0)

    cv2.imwrite(output_path, final, [cv2.IMWRITE_JPEG_QUALITY, 95])

    fh, fw = final.shape[:2]
    footer_h = int(fh * 0.25)
    footer_y = fh - footer_h
    mid_x = fw // 2

    zoom_left = final[footer_y:fh, 0:mid_x]
    zoom_right = final[footer_y:fh, mid_x:fw]

    left_path = output_path.replace(".jpg", "_zL.jpg")
    right_path = output_path.replace(".jpg", "_zR.jpg")

    cv2.imwrite(left_path, zoom_left, [cv2.IMWRITE_JPEG_QUALITY, 98])
    cv2.imwrite(right_path, zoom_right, [cv2.IMWRITE_JPEG_QUALITY, 98])

    status_msg = "Rectified+Crop+Zooms" if rectified or was_cropped else "Enhanced+Zooms"
    print(status_msg)
    return True, status_msg


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    optimize_medical_slide(sys.argv[1], sys.argv[2])
