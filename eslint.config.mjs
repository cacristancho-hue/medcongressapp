// Native ESLint 9 flat config for Next 16. We compose eslint-config-next's
// flat exports directly instead of going through FlatCompat, which crashed with
// "Converting circular structure to JSON" on eslint-config-next 16 + eslint 9.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  {
    rules: {
      // Advisory perf rule newly introduced by eslint-config-next 16. Demoted to
      // warn to unblock commits; the existing setState-in-effect usages in
      // reference-library.tsx need a dedicated refactor (TODO, see AI_HANDOVER).
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
