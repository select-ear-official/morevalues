const fs = require('fs');
let questions;
const originalJs = fs.readFileSync('C:/Users/Olwethu/Documents/8Values/8values.github.io/questions.js', 'utf8');
eval(originalJs);

const mapped = questions.map((q, i) => {
    let effects = {};
    if (q.effect.econ !== 0) effects.econ = q.effect.econ;
    if (q.effect.dipl !== 0) effects.dipl = q.effect.dipl;
    if (q.effect.govt !== 0) effects.govt = q.effect.govt;
    if (q.effect.scty !== 0) effects.scty = q.effect.scty;
    return {
        id: i + 1,
        text: q.question,
        effects: effects
    };
});

fs.writeFileSync('mapped_questions.json', JSON.stringify(mapped, null, 2));
