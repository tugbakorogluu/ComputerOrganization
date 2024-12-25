import * as parser from './parser.js';
import * as tokens from './tokens.js';

export function compileToHex(assemblyCode) {
  const machineCode = [];
  assemblyCode.forEach(instruction => {
    const cleanedInstruction = removeCommentsAndWhitespace(instruction);
    if (cleanedInstruction) {
      const compiledInstruction = compileInstruction(cleanedInstruction);
      const hexCode = parseInt(compiledInstruction, 2).toString(16).padStart(8, "0");
      machineCode.push(hexCode);
    }
  });
  return machineCode;
}
// Function to compile assembly code into binary machine code
export function compileToBin(assemblyCode) {
  const machineCode = [];
  // Iterate over each instruction in the assembly code
  assemblyCode.forEach(instruction => {
    // Clean the instruction by removing comments and whitespace
    const cleanedInstruction = removeCommentsAndWhitespace(instruction);
    if (cleanedInstruction) {
      // Compile the cleaned instruction into binary machine code
      machineCode.push(compileInstruction(cleanedInstruction));
    }
  });
  return machineCode; // Return the binary machine code array

}
// Function to compile a single instruction based on its type (R-type, I-type, or J-type)
function compileInstruction(instruction) {
  const [opcode, ...args] = instruction.trim().split(/\s+/);
  // Check if the instruction is an R-type instruction
  if (tokens.RTypeInstructions.hasOwnProperty(opcode)) {
    return compileRTypeInstruction(instruction);
  } 
  // Check if the instruction is an I-type instruction
    else if (tokens.ITypeInstructions.hasOwnProperty(opcode)) {
    return compileITypeInstruction(instruction);
  } 
  // Check if the instruction is a J-type instruction  
    else if (tokens.JTypeInstructions.hasOwnProperty(opcode)) {
    return compileJTypeInstruction(instruction);
  } 
  // Throw an error for unknown instructions
    else {
    throw new Error(`Unknown instruction: ${instruction}`);
  }
}
// Function to compile R-type instructions into binary machine code
function compileRTypeInstruction(instruction) {
  const parts = parser.parseInstruction(instruction);
  if (parts.category === "Register") {
    const { category, opcode, rd, rs, rt } = parts;
    return tokens.RTypeInstructions[opcode].opcode +
      tokens.registers[rs] +
      tokens.registers[rt] +
      tokens.registers[rd] +
      "00000" + // Shift amount is always 0 for basic register operations
      tokens.RTypeInstructions[opcode].funct; // Append the function code
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
// Function to compile I-type instructions into binary machine code
function compileITypeInstruction(instruction) {
  const parts = parser.parseInstruction(instruction);
  if (parts.category === "LoadUpperImmediate") {
    const { category, opcode, rt, immediate } = parts;
    return tokens.ITypeInstructions[opcode].opcode +
      "00000" + // rs is always 0 for load upper immediate
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

function compileJTypeInstruction(instruction) {
  const { category, opcode, target } =
    parser.parseInstruction(instruction);
  return tokens.JTypeInstructions[opcode].opcode +
    convertImmediateToBinary(target, 26);
}

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

function removeCommentsAndWhitespace(instruction) {
  const trimmedInstruction = instruction.split('#')[0].trim();
  return trimmedInstruction.length > 0 ? trimmedInstruction : null;
}
