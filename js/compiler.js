import * as parser from "./parser.js";
import * as tokens from "./tokens.js";

function processLabels(assemblyCode) {
  // Remove empty lines and comments
  const cleanCode = assemblyCode
    .map((line) => {
      const commentIndex = line.indexOf("#");
      return commentIndex >= 0
        ? line.slice(0, commentIndex).trim()
        : line.trim();
    })
    .filter((line) => line);

  // Collect labels
  const labels = parser.collectLabels(cleanCode);

  // Remove label definitions
  const processedCode = cleanCode.filter((line) => !line.match(/^\w+:/));

  return {
    code: processedCode,
    labels: labels,
  };
}

export function compileToHex(assemblyCode) {
  const { code, labels } = processLabels(assemblyCode);
  const machineCode = [];

  code.forEach((instruction, index) => {
    const cleanedInstruction = removeCommentsAndWhitespace(instruction);
    if (cleanedInstruction) {
      const compiledInstruction = compileInstruction(
        cleanedInstruction,
        labels,
        index * 4
      );
      const hexCode = parseInt(compiledInstruction, 2)
        .toString(16)
        .padStart(8, "0");
      machineCode.push(hexCode);
    }
  });

  return machineCode;
}

export function compileToBin(assemblyCode) {
  const { code, labels } = processLabels(assemblyCode);
  const machineCode = [];

  code.forEach((instruction, index) => {
    const cleanedInstruction = removeCommentsAndWhitespace(instruction);
    if (cleanedInstruction) {
      machineCode.push(
        compileInstruction(cleanedInstruction, labels, index * 4)
      );
    }
  });

  return machineCode;
}

function compileInstruction(instruction, labels, currentPC) {
  const [opcode, ...args] = instruction.trim().split(/\s+/);

  if (tokens.RTypeInstructions.hasOwnProperty(opcode)) {
    return compileRTypeInstruction(instruction);
  } else if (tokens.ITypeInstructions.hasOwnProperty(opcode)) {
    return compileITypeInstruction(instruction, labels, currentPC);
  } else if (tokens.JTypeInstructions.hasOwnProperty(opcode)) {
    return compileJTypeInstruction(instruction, labels);
  } else {
    throw new Error(`Unknown instruction: ${instruction}`);
  }
}

function compileRTypeInstruction(instruction) {
  const parts = parser.parseInstruction(instruction);
  if (parts.category === "Register") {
    const { category, opcode, rd, rs, rt } = parts;
    return (
      tokens.RTypeInstructions[opcode].opcode +
      tokens.registers[rs] +
      tokens.registers[rt] +
      tokens.registers[rd] +
      "00000" +
      tokens.RTypeInstructions[opcode].funct
    );
  } else if (parts.category === "Shift") {
    const { category, opcode, rd, rt, shamt } = parts;
    return (
      tokens.RTypeInstructions[opcode].opcode +
      "00000" +
      tokens.registers[rt] +
      tokens.registers[rd] +
      convertImmediateToBinary(shamt, 5) +
      tokens.RTypeInstructions[opcode].funct
    );
  } else if (parts.category === "MultDiv") {
    const { category, opcode, rs, rt } = parts;
    return (
      tokens.RTypeInstructions[opcode].opcode +
      tokens.registers[rs] +
      tokens.registers[rt] +
      "00000" +
      "00000" +
      tokens.RTypeInstructions[opcode].funct
    );
  } else if (parts.category === "MoveFrom") {
    const { category, opcode, rd } = parts;
    return (
      tokens.RTypeInstructions[opcode].opcode +
      "00000" +
      "00000" +
      tokens.registers[rd] +
      "00000" +
      tokens.RTypeInstructions[opcode].funct
    );
  } else if (parts.category === "RJump") {
    const { category, opcode, rs } = parts;
    return (
      tokens.RTypeInstructions[opcode].opcode +
      tokens.registers[rs] +
      "00000" +
      "00000" +
      "00000" +
      tokens.RTypeInstructions[opcode].funct
    );
  }
}

function compileITypeInstruction(instruction, labels, currentPC) {
  const parts = parser.parseInstruction(instruction);

  if (parts.category === "LoadUpperImmediate") {
    const { category, opcode, rt, immediate } = parts;
    return (
      tokens.ITypeInstructions[opcode].opcode +
      "00000" +
      tokens.registers[rt] +
      convertImmediateToBinary(immediate, 16)
    );
  } else {
    const { category, opcode, rt, rs, immediate, isLabel } = parts;
    let immediateValue = immediate;

    if (isLabel) {
      if (!labels.hasOwnProperty(immediate)) {
        throw new Error(`Undefined label: ${immediate}`);
      }
      
      // Branch komutları için özel hesaplama
      if (opcode === "beq" || opcode === "bne") {
        const targetAddress = labels[immediate];
        const nextInstructionAddress = currentPC + 4;
        // Hedef adres ile bir sonraki komut arasındaki farkı hesapla ve 4'e böl
        immediateValue = (targetAddress - nextInstructionAddress) >> 2;
      }
    }

    // Immediate değeri 16-bit signed integer olmalı
    let binaryImmediate;
    if (typeof immediateValue === "number") {
      // Negatif sayılar için 2's complement
      if (immediateValue < 0) {
        immediateValue = (1 << 16) + immediateValue;
      }
      binaryImmediate = immediateValue.toString(2).padStart(16, '0');
    } else {
      binaryImmediate = convertImmediateToBinary(immediateValue.toString(), 16);
    }

    return (
      tokens.ITypeInstructions[opcode].opcode +
      tokens.registers[rs] +
      tokens.registers[rt] +
      binaryImmediate
    );
  }
}

function compileJTypeInstruction(instruction, labels) {
  const parts = instruction.split(/[\s,]+/);
  const opcode = parts[0];
  const label = parts[1];

  if (!labels.hasOwnProperty(label)) {
    throw new Error(`Undefined label: ${label}`);
  }

  const address = labels[label] >>> 2; // Divide by 4 to get word address
  return (
    tokens.JTypeInstructions[opcode].opcode +
    address.toString(2).padStart(26, "0")
  );
}

function convertImmediateToBinary(immediate, length) {
  try {
    let binary;
    if (immediate.startsWith('-')) {
      binary = (Math.pow(2, length) + parseInt(immediate)).toString(2);
    } else if (immediate.startsWith('0x')) {
      binary = parseInt(immediate.substring(2), 16).toString(2);
    } else if (immediate.startsWith('0b')) {
      binary = immediate.substring(2);
    } else {
      binary = parseInt(immediate).toString(2);
    }

    if (binary.length > length) {
      alert(`Binary value ${binary} exceeds the provided length of ${length}.`);
      return null;  // Return null to avoid overflow or incorrect output
    }

    return binary.padStart(length, '0');
  } catch (error) {
    alert(`Immediate conversion error: ${error.message}`);
    return null;  // Return null in case of conversion error
  }
}

function removeCommentsAndWhitespace(instruction) {
  const trimmedInstruction = instruction.split("#")[0].trim();
  return trimmedInstruction.length > 0 ? trimmedInstruction : null;
}