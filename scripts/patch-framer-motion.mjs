import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

const root = process.cwd();
const packageRoot = join(root, 'node_modules', 'framer-motion', 'dist', 'es');

const files = [
  {
    path: join(packageRoot, 'animation', 'hooks', 'use-animate.mjs'),
    content: `"use client";\nimport { useMemo } from 'react';\nimport { useReducedMotionConfig } from '../../utils/reduced-motion/use-reduced-motion-config.mjs';\nimport { useConstant } from '../../utils/use-constant.mjs';\nimport { useUnmountEffect } from '../../utils/use-unmount-effect.mjs';\nimport { createScopedAnimate } from '../animate/index.mjs';\n\nfunction useAnimate() {\n    const scope = useConstant(() => ({\n        current: null,\n        animations: [],\n    }));\n    const reduceMotion = useReducedMotionConfig() ?? undefined;\n    const animate = useMemo(() => createScopedAnimate({ scope, reduceMotion }), [scope, reduceMotion]);\n    useUnmountEffect(() => {\n        scope.animations.forEach((animation) => animation.stop());\n        scope.animations.length = 0;\n    });\n    return [scope, animate];\n}\n\nexport { useAnimate };\n//# sourceMappingURL=use-animate.mjs.map\n`,
  },
  {
    path: join(packageRoot, 'animation', 'hooks', 'use-animate-style.mjs'),
    content: `"use client";\nimport { useConstant } from '../../utils/use-constant.mjs';\nimport { useUnmountEffect } from '../../utils/use-unmount-effect.mjs';\nimport { createScopedWaapiAnimate } from '../animators/waapi/animate-style.mjs';\n\nfunction useAnimateMini() {\n    const scope = useConstant(() => ({\n        current: null,\n        animations: [],\n    }));\n    const animate = useConstant(() => createScopedWaapiAnimate(scope));\n    useUnmountEffect(() => {\n        scope.animations.forEach((animation) => animation.stop());\n    });\n    return [scope, animate];\n}\n\nexport { useAnimateMini };\n//# sourceMappingURL=use-animate-style.mjs.map\n`,
  },
];

function patchNextEslintPlugin() {
  const rulesDir = join(
    root,
    'node_modules',
    '@next',
    'eslint-plugin-next',
    'dist',
    'rules'
  );

  if (!existsSync(rulesDir)) {
    console.warn('[patch-next-eslint] eslint-plugin-next package not found, skipping');
    return;
  }

  for (const entry of readdirSync(rulesDir)) {
    if (!entry.endsWith('.js')) {
      continue;
    }

    const filePath = join(rulesDir, entry);
    const original = readFileSync(filePath, 'utf8');
    let patched = original;

    patched = patched.replace(
      /var _definerule = require\("\.\.\/utils\/define-rule"\);\n/,
      ''
    );
    patched = patched.replace(
      /var _default = \(0, _definerule\.defineRule\)\(\{/,
      'var _default = ({'
    );

    if (patched !== original) {
      writeFileSync(filePath, patched, 'utf8');
    }
  }
}

if (!existsSync(packageRoot)) {
  console.warn('[patch-framer-motion] framer-motion package not found, skipping');
} else {
  for (const file of files) {
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content, 'utf8');
  }
}

patchNextEslintPlugin();
