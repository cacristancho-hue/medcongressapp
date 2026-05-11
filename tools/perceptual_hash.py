import cv2
import sys
import numpy as np

def dhash(image_path, hash_size=8):
    """
    Calcula el Perceptual Hash (dHash) de una imagen.
    Resistente a cambios leves de resolución, brillo o compresión.
    """
    try:
        image = cv2.imread(image_path)
        if image is None: return None
        
        # 1. Convertir a gris y redimensionar a 9x8 (para dhash de 8 bits)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, (hash_size + 1, hash_size))
        
        # 2. Calcular diferencia entre píxeles adyacentes
        diff = resized[:, 1:] > resized[:, :-1]
        
        # 3. Convertir a string hexadecimal
        return "".join([f"{int(b):x}" for b in diff.flatten()])
    except:
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    print(dhash(sys.argv[1]))
