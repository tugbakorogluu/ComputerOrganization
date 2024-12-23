import * as parser from './parser.js';
import * as tokens from './tokens.js';

// Bu fonksiyon, Assembly kodunu onaltılı (hex) makine koduna dönüştürür.

export function compileToHex(assemblyCode) {
  const machineCode = [];
  assemblyCode.forEach(instruction => {
    const compiledInstruction = compileInstruction(instruction); // Bu fonksiyon önce binarye çevirir.
    const hexCode = parseInt(compiledInstruction, 2).toString(16).padStart(8, "0"); // Burada hexadecimale çevirir.
    machineCode.push(hexCode);
  });
  return machineCode;
}

// Bu fonksiyon, Assembly kodunu ikili (binary) makine koduna dönüştürür.

export function compileToBin(assemblyCode) {
  const machineCode = [];
  assemblyCode.forEach(instruction => {
    machineCode.push(compileInstruction(instruction));
  });
  return machineCode;
}

//Bu fonksiyon, her bir Assembly komutunu alır ve opcode'u analiz ederek uygun R, I veya J tipi komutlara yönlendirir.

function compileInstruction(instruction) {
  const [opcode, ...args] = instruction.trim().split(/\s+/);

  if (tokens.RTypeInstructions.hasOwnProperty(opcode)) {
    return compileRTypeInstruction(instruction);
  } else if (tokens.ITypeInstructions.hasOwnProperty(opcode)) {
    return compileITypeInstruction(instruction);
  } else if (tokens.JTypeInstructions.hasOwnProperty(opcode)) {
    return compileJTypeInstruction(instruction);
  } else {
    throw new Error(`Unknown instruction: ${instruction}`);
  }
}

/*R tipi komutlar, üç kayıt (register) kullanarak işlemler yapar ve sabit bir formatla yazılır.
 Örneğin, add, sub, and, or gibi komutlar.
 Bu fonksiyon, parser.parseInstruction(instruction) fonksiyonunu çağırarak komutu parçalara ayırır ve 
 ardından opcode ve funct bilgilerini kullanarak makine kodunu oluşturur.
 R tipi komutlar için farklı kategorilerde derleme yapılır: Register, Shift, MultDiv, MoveFrom, ve RJump.*/

function compileRTypeInstruction(instruction) {
  const parts = parser.parseInstruction(instruction);
  if (parts.category === "Register") {
    const { category, opcode, rd, rs, rt } = parts;
    return tokens.RTypeInstructions[opcode].opcode +
      tokens.registers[rs] +
      tokens.registers[rt] +
      tokens.registers[rd] +
      "00000" +
      tokens.RTypeInstructions[opcode].funct;
  } else if (parts.category === "Shift") {
    const { category, opcode, rd, rt, shamt } = parts;
    return tokens.RTypeInstructions[opcode].opcode +
      "00000" +
      tokens.registers[rt] +
      tokens.registers[rd] +
      convertImmediateToBinary(shamt, 5) +
      tokens.RTypeInstructions[opcode].funct;
  } else if (parts.category === "MultDiv") {
    const { category, opcode, rs, rt } = parts;
    return tokens.RTypeInstructions[opcode].opcode +
      tokens.registers[rs] +
      tokens.registers[rt] +
      "00000" +
      "00000" +
      tokens.RTypeInstructions[opcode].funct;
  } else if (parts.category === "MoveFrom") {
    const { category, opcode, rd } = parts;
    return tokens.RTypeInstructions[opcode].opcode +
      "00000" +
      "00000" +
      tokens.registers[rd] +
      "00000" +
      tokens.RTypeInstructions[opcode].funct;
  } else if (parts.category === "RJump") {
    const { category, opcode, rs } = parts;
    return tokens.RTypeInstructions[opcode].opcode +
      tokens.registers[rs] +
      "00000" +
      "00000" +
      "00000" +
      tokens.RTypeInstructions[opcode].funct;
  }

}

// In here we are using a helper function parser to parse instractions
// Then we return a dictionary in tokens and the index is opcode itself and we get the opcode

/*I tipi komutlar, iki kayıt ve bir sabit değeri (immediate) kullanarak işlemler yapar. 
Örneğin, addi, andi, lw, sw gibi komutlar.
Bu fonksiyon da, parser.parseInstruction(instruction) ile komutu parçalar
ve gerekli bilgileri kullanarak makine kodunu oluşturur.
Eğer komut bir "Load Upper Immediate" (lui) komutuysa, farklı bir işleme tabi tutulur. */


function compileITypeInstruction(instruction) {
  const parts = parser.parseInstruction(instruction);
  if (parts.category === "LoadUpperImmediate") {
    const { category, opcode, rt, immediate } = parts;
    return tokens.ITypeInstructions[opcode].opcode +
      "00000" +
      tokens.registers[rt] +
      convertImmediateToBinary(immediate, 16);
  } else {
    const { category, opcode, rt, rs, immediate } = parts;
    return tokens.ITypeInstructions[opcode].opcode +
      tokens.registers[rs] +
      tokens.registers[rt] +
      convertImmediateToBinary(immediate, 16);
  }
}

/* J tipi komutlar, genellikle jump komutlarıdır, yani programın yürütme akışını değiştiren komutlar. 
Örneğin, j (jump), jal (jump and link) gibi komutlar. 
Bu fonksiyon, parser.parseInstruction(instruction) ile komutu parçaladıktan sonra,
opcode ve target bilgilerini kullanarak makine kodunu oluşturur. */

function compileJTypeInstruction(instruction) {
  const { category, opcode, target } =
    parser.parseInstruction(instruction);
  return tokens.JTypeInstructions[opcode].opcode +
    convertImmediateToBinary(target, 26);
}

/* Bu fonksiyon, immediate değerini (sabit değer) istenen uzunluktaki ikili (binary) formata dönüştürür.
Negatif, onaltılı (hex), ikili (binary) veya 
desimal (decimal) değerleri doğru şekilde işleyip ikili (binary) formata dönüştürür.
Eğer verilen uzunluktan daha büyük bir değer varsa, bir hata fırlatılır. */

function convertImmediateToBinary(immediate, length) {
  let binary;
  if (immediate.startsWith('-')) {
    // negative decimal immediate value
    binary = (Math.pow(2, length) + parseInt(immediate)).toString(2);
  } else if (immediate.startsWith('0x')) {
    // hexadecimal immediate value
    binary = parseInt(immediate.substring(2), 16).toString(2);
  } else if (immediate.startsWith('0b')) {
    // binary immediate value
    binary = immediate.substring(2);
  } else { // decimal immediate value
    binary = parseInt(immediate).toString(2);
  }

  if (binary.length > length) {
    throw new Error(`Binary value ${binary} exceeds the provided length of ${length}.`);
  }

  return binary.padStart(length, '0');
}

/*Bu derleyici, MIPS Assembly kodlarını alır ve bunları makine koduna dönüştürür. 
Assembly kodu, R tipi, I tipi ve J tipi komutlara göre işlenir ve her tür için uygun bir ikili (binary) kod üretilir.
Ardından, bu ikili kodlar, onaltılı (hex) veya ikili (binary) formatta döndürülür.*/

