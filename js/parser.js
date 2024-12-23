import * as tokens from './tokens.js';

/*Bu fonksiyon, bir assembly komutunu alır ve onu üç ana kategoriye ayırarak analiz eder:
R-Tipi komutlar (parseRtype), I-Tipi komutlar (parseItype), J-Tipi komutlar (parseJtype) 
İlk olarak opcode'u ve argümanları ayırarak bu komutların hangi türde olduğunu belirler. 
Ardından uygun fonksiyona yönlendirme yapar.
Eğer komut geçerli bir R-Tipi, I-Tipi veya J-Tipi komutsa, bu fonksiyon komutu döndürür. 
Aksi takdirde bir hata fırlatır.*/

export function parseInstruction(instruction) {
  const [opcode, ...args] = instruction.trim().split(/\s+/);
  

  const rTypeInstruction = parseRtype(instruction);
  const iTypeInstruction = parseItype(instruction);
  const jTypeInstruction = parseJtype(instruction);

  if (tokens.RTypeInstructions.hasOwnProperty(opcode) && rTypeInstruction) {
    return rTypeInstruction;
  } else if (tokens.ITypeInstructions.hasOwnProperty(opcode) && iTypeInstruction) {
    return iTypeInstruction;
  } else if (tokens.JTypeInstructions.hasOwnProperty(opcode) && jTypeInstruction) {
    return jTypeInstruction;
  } else {
    throw new Error(`Invalid instruction: ${instruction}`);
  }
}

/* R-Tipi komutları, üç kayıt (register) kullanarak işlem yapar. Örneğin, add, sub, and, or gibi komutlar.
Bu fonksiyon, farklı R-Tipi komutları tanımak için bir dizi regex kullanır:
rTypeRegex: Standart R-tipi komutlar için.
shiftRegex: Shifting (bit kaydırma) komutları için.
multDiv: Çarpma ve bölme komutları için.
mfRegex: Move From komutları için (örneğin mfhi veya mflo).
jumpRegex: Jump komutları için (jr komutu). 
Bu komutlar uygun regex ile eşleşirse, komutun kategorisini ve bileşenlerini çıkarır ve döndürür. */

function parseRtype(instruction) {
  const rTypeRegex = /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*\$(\w+)$/i;
  const shiftRegex = /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*(\d+|0x[\da-fA-F]+)$/i;
  const multDiv = /^(\w+)\s+\$(\w+),\s*\$(\w+)$/i;
  const mfRegex = /^mf(\w+)\s+\$(\w+)$/i;
  const jumpRegex = /^jr\s+\$(\w+)$/i;

  const rTypeMatches = instruction.match(rTypeRegex);
  const shiftMatches = instruction.match(shiftRegex);
  const multDivMatches = instruction.match(multDiv);
  const mfMatches = instruction.match(mfRegex);
  const jumpMatches = instruction.match(jumpRegex);

  if (rTypeMatches) {
    const [_, opcode, rd, rs, rt] = rTypeMatches;
    return { category: "Register", opcode, rd: "$" + rd, rs: "$" + rs, rt: "$" + rt };
  } else if (shiftMatches) {
    const [_, opcode, rd, rt, shamt] = shiftMatches;
    return { category: "Shift", opcode, rd: "$" + rd, rt: "$" + rt, shamt };
  } else if (multDivMatches) {
    const [_, opcode, rs, rt] = multDivMatches;
    return { category: "MultDiv", opcode: opcode, rs: "$" + rs, rt: "$" + rt };
  } else if (mfMatches) {
    const [_, opcode, rd] = mfMatches;
    return { category: "MoveFrom", opcode: "mf" + opcode, rd: "$" + rd };
  } else if (jumpMatches) {
    const [_, rs] = jumpMatches;
    return { category: "RJump", opcode: "jr", rs: "$" + rs };
  } else {
    return null;
  }
}

/* Bu fonksiyon, I-Tipi komutlarını tanımak için üç regex kullanır:
itypeRegex: Genel I-tipi komutlar için.
loadStoreRegex: Yükleme ve depolama (load/store) komutları için.
luiRegex: Load Upper Immediate komutu (lui).
Komutlar uygun regex ile eşleşirse, opcode ve ilgili bileşenler çıkarılır ve döndürülür. */

function parseItype(instruction) {
  const itypeRegex = /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)$/i;
  const loadStoreRegex = /^(\w+)\s+\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)\((\$\w+)\)$/i;
  const luiRegex = /^lui\s+\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)$/i;

  const itypeMatches = instruction.match(itypeRegex);
  const loadStoreMatches = instruction.match(loadStoreRegex);
  const luiMatches = instruction.match(luiRegex);

  if (itypeMatches) {
    const [_, opcode, rt, rs, immediate] = itypeMatches;
    return { category: "Immediate", opcode, rt: "$" + rt, rs: "$" + rs, immediate };
  } else if (loadStoreMatches) {
    const [_, opcode, rt, immediate, rs] = loadStoreMatches;
    return { category: "LoadStore", opcode, rt: "$" + rt, rs, immediate };
  } else if (luiMatches) {
    const [_, rt, immediate] = luiMatches;
    return { category: "LoadUpperImmediate", opcode: "lui", rt: "$" + rt, immediate };
  } else {
    return null;
  }
}

/* Bu fonksiyon, J-tipi komutlarını tanımak için sadece bir regex kullanır:
jTypeRegex: Jump komutları için.
Regex ile eşleşen komutun opcode ve hedef (target) bilgilerini çıkarır ve döndürür. */

function parseJtype(instruction) {
  const jTypeRegex = /^(\w+)\s+(\d+|0x[\da-fA-F]+|0b[01]+)$/i;

  const jTypeMatches = instruction.match(jTypeRegex);

  if (jTypeMatches) {
    const [_, opcode, target] = jTypeMatches;
    return { category: "Jump", opcode, target: target };
  } else {
    return null;
  }
}

/*Bu parser.js dosyası, MIPS assembly kodlarını analiz ederek her bir komutun tipini (R-Tipi, I-Tipi, J-Tipi) 
ve bileşenlerini (opcode, registerler, immediate değerler) belirler.Bu analiz, assembly komutlarını makine koduna
dönüştürmeden önce komutun doğru bir şekilde anlaşılmasını sağlar. */
