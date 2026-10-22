const transpileHTML = require('../lib/html-transpiler.js');

const source = `
<ሰነድ>
  <ራስ>
    <አርእስት>የእኔ ገጽ</አርእስት>
  </ራስ>
  <ሰውነት>
    <ራስጌ>
      <ርዕስ1>ሰላም ልጆች!</ርዕስ1>
    </ራስጌ>
    <ዋና>
      <አንቀጽ መደብ="መግቢያ">ይህ የመጀመሪያ ገጼ ነው።</አንቀጽ>
      <ዝርዝር>
        <ንጥል>ፖም</ንጥል>
        <ንጥል>ሙዝ</ንጥል>
      </ዝርዝር>
      <አገናኝ አድራሻ="https://simplexer.et">ሲምፕሌክሰርን ጎብኝ</አገናኝ>
      <ስዕል ምንጭ="lion.jpg" መግለጫ="አንበሳ" />
      <አዝራር ሲነካ="ሰላምበል()">ጫን</አዝራር>
    </ዋና>
  </ሰውነት>
</ሰነድ>
`;

const { html, warnings } = transpileHTML(source);
console.log('--- OUTPUT HTML ---');
console.log(html);
console.log('--- WARNINGS ---');
console.log(warnings.length ? warnings.join('\n') : '(none)');
