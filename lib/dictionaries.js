(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.DIRENYA = mod;
})(typeof self !== 'undefined' ? self : this, function () {

  // ---- HTML tag names: Amharic/Latin -> real tag ----
  const TAGS = {
    "ሰነድ": "html", "sened": "html",
    "ራስ": "head", "ras": "head", "rese": "head",
    "አርስት": "title", "arist": "title",
    "አርእስት": "title",
    "አካል": "body", "akale": "body",
    "ሰውነት": "body",
    "ስልት": "style", "silt": "style",
    "ዘይቤ": "style", 
    "ትዛዝ": "script", "tezaz": "script",
    "ትእዛዝ": "script",
    "መረጃ": "meta", "mereja": "meta",
    "ማያያዣ": "link", "mayayazha": "link",

    "ራስጌ": "header", "rasge": "header", "ራ": "header", "ra": "header",
    "ግርጌ": "footer", "girge": "footer", "ግ": "footer", "g": "footer",
    "ማውጫ": "nav", "mawcha": "nav",
    "ዋና": "main", "wana": "main",
    "ምዕራፍ": "section", "mieraf": "section",
    "ጽሑፍ": "article", "tsihuf": "article",
    "ጎን": "aside", "gon": "aside",
    "ክፍል": "div", "kifil": "div",
    "ንዑስ": "span", "nius": "span", "ንኡስ": "span", "nius": "span",

    "ርዕስ1": "h1", "ርዕስ2": "h2", "ርዕስ3": "h3",
    "ርዕስ4": "h4", "ርዕስ5": "h5", "ርዕስ6": "h6",
    "ries1": "h1", "ries2": "h2", "ries3": "h3",
    "ries4": "h4", "ries5": "h5", "ries6": "h6",
    "ር1": "h1", "ር2": "h2", "ር3": "h3",
    "ር4": "h4", "ር5": "h5", "ር6": "h6",
    "r1": "h1", "r2": "h2", "r3": "h3",
    "r4": "h4", "r5": "h5", "r6": "h6",
    "አንቀጽ": "p", "anketse": "p", "አ1": "pre", "an1": "pre",
    "አስቀድሞ-የተቀረጸ": "pre",
    "አገናኝ": "a", "agenagne": "a",
    "ምስል": "img", "mesele": "img",
    "ስዕል": "img",
    "ደማቅ": "strong", "demak": "strong",
    "ሰያፍ": "em", "seyaf": "em",
    "መስበሪያ": "br", "mesberya": "br",
    "መለያያ": "hr", "meleyaya": "hr",

    "ዝርዝር": "ul", "zirzir": "ul",
    "ቅደም": "ol", "kidem": "ol",
    "ንጥል": "li", "nitil": "li",

    "ቅጽ": "form", "kits": "form",
    "ማስገቢያ": "input", "masgebya": "input",
    "መጫኛ": "button", "mechagna": "button",
    "አዝራር": "button",
    "ምልክት": "label", "milkt": "label",
    "ምርጫ": "select", "mircha": "select",
    "አማራጭ": "option", "amaratch": "option",
    "ሳጥን": "textarea", "saten": "textarea",
    "ጽሑፍ-ሳጥን": "textarea",

    "ሰንጠረዥ": "table", "sentereezh": "table", "ሰን": "table", "sene": "table",
    "ረድፍ": "tr", "redf": "tr",
    "አምድ": "td", "amd": "td",
    "ራስ-አምድ": "th", "ras-amd": "th",

    // ---- added: media & extra structural/text tags ----
    "ቪዲዮ": "video", "video": "video",
    "ድምጽ": "audio", "dimts": "audio",
    "ፍሬም": "iframe", "frame": "iframe",
    "ክፈፍ": "iframe",
    "ምንጭ-ፋይል": "source", "mnch-file": "source",
    "ማቀፊያ": "figure", "maktefiya": "figure",
    "ስእል-ማቀፊያ": "figure",
    "ስእል-መግለጫ": "figcaption", "siel-megelecha": "figcaption", "ስዕል-መግለጫ": "figcaption",
    "ጥቅስ": "blockquote", "tikes": "blockquote",
    "ኮድ": "code", "kod": "code",
    "አንቀጽ2": "pre", "anketse2": "pre", "አ2": "pre", "an2": "pre",
    "ትንሽ": "small", "tinish": "small",
    "ምልክት-ማድረጊያ": "mark", "milkt-madregya": "mark",
    "ጊዜ-ምልክት": "time", "gize-milkt": "time",
    "ሸራ": "canvas", "shera": "canvas",
  };

  // ---- HTML attribute names: Amharic/Latin -> real attribute ----
  const ATTRS = {
    "መደብ": "class", "medeb": "class",
    "መለያ": "id", "meleya": "id",
    "ስልት": "style", "silt": "style",
    "አድራሻ": "href", "adrasha": "href",
    "ምንጭ": "src", "minch": "src",
    "መግለጫ": "alt", "megelecha": "alt",
    "ዓይነት": "type", "aynet": "type", "አይነት": "type", 
    "ዋጋ": "value", "waga": "value",
    "ጠቋሚ": "placeholder", "tekwami": "placeholder",
    "ስም": "name", "sim": "name",
    "ግዴታ": "required", "gideta": "required",
    "ዝግ": "disabled", "zig": "disabled",
    "ሲነካ": "onclick", "sineka": "onclick",
    "ሲቀየር": "onchange", "sikeyer": "onchange",
    "ኢላማ": "target", "ilama": "target",
    "ረድፎች": "rows", "redfoch": "rows",
    "አምዶች": "cols", "amdoch": "cols",

    // ---- added: media & form attributes ----
    "አጫውት": "autoplay", "achawet": "autoplay",
    "ራስ-አጫውት": "autoplay",
    "ቁጥጥሮች": "controls", "kutstoch": "controls",
    "ደጋግም": "loop", "degagme": "loop",
    "ደጋግሞ-አጫውት": "loop",
    "ድምጽ-አጥፋ": "muted", "dimtse-atefa": "muted", "ድምጽ-አ": "muted", "dimtse-a": "muted",
    "ድምጸ-ከል": "muted",
    "ተመርጦ": "checked", "temercho": "checked",
    "ዝቅተኛ": "min", "zeketegna": "min",
    "ከፍተኛ": "max", "keftegna": "max",
    "ከፍተኛ-ገደብ": "max",
    "ደረጃ": "step", "dereja": "step",
    "ለ": "for", "le": "for",
    "አምድ-ዝርጋታ": "colspan", "amd-zirgata": "colspan", "አምድ-ዝ": "colspan", "amd-ze": "colspan",
    "ረድፍ-ዝርጋታ": "rowspan", "redf-zirgata": "rowspan", "ረድፍ-ዝ": "rowspan", "redf-ze": "rowspan",
  };

  // ---- CSS property names: Amharic/Latin -> real property ----
  const CSS_PROPS = {
    "ቀለም": "color", "kelem": "color", "ቀ": "color", "k": "color",
    "ጀርባ-ቀለም": "background-color", "jerba-kelem": "background-color",  "ጀርባ-ቀ": "background-color", "jerba-k": "background-color",
    "የጀርባ-ቀለም": "background-color",
    "ጀርባ": "background", "jerba": "background",
    "ፊደል-መጠን": "font-size", "yefidel-meten": "font-size",
    "ፊደል-መ": "font-size", "yefidel-m": "font-size",
    "የፊደል-መጠን": "font-size",
    "ፊደል-ድምቀት": "font-weight", "yefidel-demket": "font-weight",
    "ፊደል-ድ": "font-weight", "yefidel-de": "font-weight",
    "የፊደል-ክብደት": "font-weight",
    "ፊደል-ዓይነት": "font-family", "yefidel-aynet": "font-family",
    "ፊደል-ዓ": "font-family", "yefidel-a": "font-family", "ፊደል-አ": "font-family",
    "የፊደል-ዓይነት": "font-family",
    "ጽሑፍ-አሰላለፍ": "text-align", "yetsihuf-aselalef": "text-align",
    "ጽሑፍ-አ": "text-align", "yetsihuf-a": "text-align",
    "የጽሑፍ-አሰላለፍ": "text-align",
    "ነፋስ": "margin", "nefas": "margin",
    "ኅዳግ": "margin",
    "ነፋስ-ላይ": "margin-top", "nefas-lay": "margin-top",
    "ኅዳግ-ላይ": "margin-top",
    "ነፋስ-ታች": "margin-bottom", "nefas-tach": "margin-bottom",
    "ኅዳግ-ታች": "margin-bottom",
    "ነፋስ-ግራ": "margin-left", "nefas-gra": "margin-left",
    "ኅዳግ-ግራ": "margin-left",
    "ነፋስ-ቀኝ": "margin-right", "nefas-kegn": "margin-right",
    "ኅዳግ-ቀኝ": "margin-right",
    "ውስጠ-ክፍተት": "padding", "wuste-kifitet": "padding",
    "ውስጠ-ክፍተት-ላይ": "padding-top", "wuste-kifitet-lay": "padding-top",
    "ውስጠ-ክፍተት-ታች": "padding-bottom", "wuste-kifitet-tach": "padding-bottom",
    "ውስጠ-ክፍተት-ግራ": "padding-left", "wuste-kifitet-gra": "padding-left",
    "ውስጠ-ክፍተት-ቀኝ": "padding-right", "wuste-kifitet-kegn": "padding-right",
    "ድንበር": "border", "dinber": "border",
    "ድንበር-ክብነት": "border-radius", "yedinber-kibnet": "border-radius",
    "ድንበር-ክ": "border-radius", "yedinber-kእ": "border-radius",
    "የድንበር-ክብነት": "border-radius",
    "ስፋት": "width", "sifat": "width",
    "ቁመት": "height", "kumet": "height",
    "ከፍተኛ-ስፋት": "max-width", "kftegna-sifat": "max-width",
    "ከፍተኛ-ቁመት": "max-height", "kftegna-kumet": "max-height",
    "ዝቅተኛ-ስፋት": "min-width", "ziketegna-sifat": "min-width",
    "ዝቅተኛ-ቁመት": "min-height", "ziketegna-kumet": "min-height",
    "አሳይ": "display", "asay": "display",
    "አቀማመጥ": "position", "akemamet": "position",
    "ላይ": "top", "lay": "top",
    "ግራ": "left", "gra": "left",
    "ቀኝ": "right", "kegn": "right",
    "ታች": "bottom", "tach": "bottom",
    "ፍሰት-አቅጣጫ": "flex-direction", "yefiset-aktatcha": "flex-direction",
    "የፍሰት-አቅጣጫ": "flex-direction",
    "ይዘት-አሰላለፍ": "justify-content", "yizet-aselalef": "justify-content",
    "ንጥሎች-አሰላለፍ": "align-items", "nitiloch-aselalef": "align-items",
    "ክፍተት": "gap", "kifitet": "gap",
    "ጠቋሚ": "cursor", "tekwami": "cursor",
    "ጠቋሚ-ቅርጽ": "cursor",
    "ግልጽነት": "opacity", "gilitsnet": "opacity",
    "ንብርብር-ቅደም": "z-index", "yenibrbir-kidem": "z-index",
    "የንብርብር-ቅደም": "z-index",
    "ጥላ": "box-shadow", "tila": "box-shadow",
    "ፅሁፍ-ማስዋቢያ": "text-decoration", "yetsihuf-maswabya": "text-decoration",
    "የፅሁፍ-ማስዋቢያ": "text-decoration",
    "መስመር-ቁመት": "line-height", "yemesmer-kumet": "line-height",
    "የመስመር-ቁመት": "line-height",

    // ---- added: layout/effects commonly needed once a page gets real ----
    "ትርፍ-ይዘት": "overflow", "tirf-yizet": "overflow",
    "መሸጋገሪያ": "transition", "meshegagerya": "transition",
    "ለውጥ": "transform", "kirts-lewt": "transform",
    "ቅርጽ-ለውጥ": "transform",
    "ፊደል-ክፍተት": "letter-spacing", "yefidel-kifitet": "letter-spacing",
    "የፊደል-ክፍተት": "letter-spacing",
  };

  // ---- Optional: common Amharic color words -> CSS color values ----
  // Applied only to color-ish properties (see css-transpiler.js)
  const CSS_COLOR_VALUES = {
    "ቀይ": "red", "key": "red",
    "ሰማያዊ": "blue", "semayawi": "blue",
    "አረንጓዴ": "green", "arengwade": "green",
    "ቢጫ": "yellow", "bicha": "yellow",
    "ጥቁር": "black", "tikur": "black",
    "ነጭ": "white", "nech": "white",
    "ብርቱካናማ": "orange", "birtukanama": "orange",
    "ወይን-ጠጅ": "purple", "weyn-tej": "purple",
    "ግራጫ": "gray", "gracha": "gray",
    "ሮዝ": "pink", "roz": "pink",
  };

  // ---- JS mini-DSL structural keywords: Amharic -> Latin alias ----
  // Read by js-transpiler.js (unlike the older documentation-only version
  // of this table) to build each pattern as (?:አማርኛ|latin). Function/
  // variable NAMES never needed this — Amharic letters are already valid
  // JS identifiers — this table only covers the block-structure words that
  // aren't valid JS syntax on their own (if/else/repeat/foreach/end/...).
  const JS_KEYWORD_ALIASES = {
    "ካሆነ": "kahone",       // if <cond>
    "ካልሆነ": "kalhone",     // else
    "ወይም": "weyim",        // else if <cond>
    "ድገም": "digem",        // repeat <n> ጊዜ/gize
    "ጊዜ": "gize",          // "times" following the repeat count
    "እያንዳንዱ": "eyandandu", // foreach <item> በ/be <list>
    "በ": "be",              // "in", used by foreach
    "ተግባር": "tegbar",      // function <name>(<params>)
    "ጨርስ": "chers",        // end (closes if/repeat/foreach/function)
    "መልስ": "mels",         // return
    "እውነት": "ewnet",       // true
    "ሐሰት": "hasete",       // false
  };

  // ---- Built-in runtime function names: Amharic -> Latin alias ----
  // Both names call the exact same function (see runtime.js) — this list
  // is what runtime.js reads to define each alias automatically, so this
  // is the ONLY place you need to add a word if you add a new builtin.
  const RUNTIME_ALIASES = {
    "ጻፍ": "tsaf",                    // write
    "አሳውቅ": "asawek",                // alert
    "አትም": "atim",                   // console.log
    "ንጥል_በመለያ": "nitil_bemeleya",    // getElementById (original name, kept working)
    "በመለያ": "nitil_bemeleya",    // getElementById
    "ንጥሎች_በመደብ": "nitiloch_bemedeb", // getElementsByClassName (original name, kept working)
    "በመደብ": "nitiloch_bemedeb", // getElementsByClassName
    "ጽሑፍ_አስቀምጥ": "tsihuf_askemt",    // set text
    "ጽሑፍ_አ": "tsihuf_a",    // set text
    "ጽሑፍ_አግኝ": "tsihuf_agn",         // get text
    "ስልት_አስቀምጥ": "silt_askemt",      // set style
    "ስልት_አ": "silt_a",      // set style
    "መደብ_ጨምር": "medeb_chemr",        // add class
    "መደብ_አስወግድ": "medeb_aswegd",     // remove class
    "መደብ_ቀያይር": "medeb_keyayir",     // toggle class
    "መደብ_ቀ": "medeb_k",     // toggle class
    "ዋጋ_አግኝ": "waga_agn",            // get value
    "ዋጋ_አስቀምጥ": "waga_askemt",       // set value
    "ስማ": "sima",                    // addEventListener
  };

  return { TAGS, ATTRS, CSS_PROPS, CSS_COLOR_VALUES, JS_KEYWORD_ALIASES, RUNTIME_ALIASES };
});