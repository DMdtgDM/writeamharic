const transpileCSS = require('../lib/css-transpiler.js');

const source = `
.ራስጌ {
  የጀርባ-ቀለም: ሰማያዊ;
  ቀለም: ነጭ;
  ውስጠ-ክፍተት: 20px;
  የጽሑፍ-አሰላለፍ: center;
}

.መግቢያ {
  የፊደል-መጠን: 18px;
  ቀለም: ቀይ;
  ኅዳግ: 10px 0;
}

.አዝራር {
  ጀርባ: green;
  ድንበር: none;
  የድንበር-ክብነት: 8px;
  ጠቋሚ-ቅርጽ: pointer;
}
`;

const { css, warnings } = transpileCSS(source);
console.log('--- OUTPUT CSS ---');
console.log(css);
console.log('--- WARNINGS ---');
console.log(warnings.length ? warnings.join('\n') : '(none)');
