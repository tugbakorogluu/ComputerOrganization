import * as parser from './parser.js';
import * as tokens from './tokens.js';

// Function to compile assembly code into hexadecimal machine code
export function compileToHex(assemblyCode) {
  const machineCode = [];
  assemblyCode.forEach(instruction => {
    try {
      const cleanedInstruction = removeCommentsAndWhitespace(instruction);
      if (cleanedInstruction) {
        const compiledInstruction = compileInstruction(cleanedInstruction);
        if (compiledInstruction) {
          const hexCode = parseInt(compiledInstruction, 2).toString(16).padStart(8, "0");
          machineCode.push(hexCode);
        }
      }
    } catch (error) {
      // Alert the user about errors in the instruction
      alert(`Error in instruction: "${instruction}". ${error.message}`);
    }
  });
  return machineCode;
}
// Function to compile assembly code into binary machine code
export function compileToBin(assemblyCode) {
  const machineCode = [];
  assemblyCode.forEach(instruction => {
    try {
      const cleanedInstruction = removeCommentsAndWhitespace(instruction);
      if (cleanedInstruction) {
        const compiledInstruction = compileInstruction(cleanedInstruction);
        if (compiledInstruction) {
          machineCode.push(compiledInstruction);
        }
      }
    } catch (error) {
      // Alert the user about errors in the instruction
      alert(`Error in instruction: "${instruction}". ${error.message}`);
    }
  });
  return machineCode;
}
// Function to compile a single instruction
function compileInstruction(instruction) {
  try {
    // Split the instruction into opcode and arguments
    const [opcode, ...args] = instruction.trim().split(/\s+/);
     // Check the type of instruction (R, I, or J) and compile accordingly
    if (tokens.RTypeInstructions.hasOwnProperty(opcode)) {
      return compileRTypeInstruction(instruction);
    } else if (tokens.ITypeInstructions.hasOwnProperty(opcode)) {
      return compileITypeInstruction(instruction);
    } else if (tokens.JTypeInstructions.hasOwnProperty(opcode)) {
      return compileJTypeInstruction(instruction);
    } else {
      // Alert if the opcode is unknown
      alert(`Unknown opcode : ${opcode}`);
      return null;  // Return null if opcode is unknown
    }
  } catch (error) {
    alert(`Failed to compile instruction: "${instruction}". ${error.message}`);
    return null;  // Ensure function does not continue in case of error
  }
}
// Function to compile R-Type instructions
function compileRTypeInstruction(instruction) {
  
    const parts = parser.parseInstruction(instruction);

    if (!parts) {
      alert("Failed to parse instruction.");
      return null;  // Return null if parsing fails
    }
    // Compile based on the category of R-Type instruction
    if (parts.category === "Register") {
      const { opcode, rd, rs, rt } = parts;
      return tokens.RTypeInstructions[opcode].opcode +
        tokens.registers[rs] +
        tokens.registers[rt] +
        tokens.registers[rd] +
        "00000" +
        tokens.RTypeInstructions[opcode].funct;
    } else if (parts.category === "Shift") {
      const { opcode, rd, rt, shamt } = parts;
      return tokens.RTypeInstructions[opcode].opcode +
        "00000" +
        tokens.registers[rt] +
        tokens.registers[rd] +
        convertImmediateToBinary(shamt, 5) +
        tokens.RTypeInstructions[opcode].funct;
    } else if (parts.category === "MultDiv") {
      const { opcode, rs, rt } = parts;
      return tokens.RTypeInstructions[opcode].opcode +
        tokens.registers[rs] +
        tokens.registers[rt] +
        "00000" +
        "00000" +
        tokens.RTypeInstructions[opcode].funct;
    } else if (parts.category === "MoveFrom") {
      const { opcode, rd } = parts;
      return tokens.RTypeInstructions[opcode].opcode +
        "00000" +
        "00000" +
        tokens.registers[rd] +
        "00000" +
        tokens.RTypeInstructions[opcode].funct;
    } else if (parts.category === "RJump") {
      const { opcode, rs } = parts;
      return tokens.RTypeInstructions[opcode].opcode +
        tokens.registers[rs] +
        "00000" +
        "00000" +
        "00000" +
        tokens.RTypeInstructions[opcode].funct;
    } else {
      alert("Unknown R-Type category.");
      return null;  // Return null for unknown categories
    }
  
    
  }

// Function to compile I-Type instructions
function compileITypeInstruction(instruction) {
  
    const parts = parser.parseInstruction(instruction);

    if (!parts) {
      alert("Failed to parse instruction.");
      return null;  // Return null if parsing fails
    }
    // Compile based on the category of I-Type instruction
    if (parts.category === "LoadUpperImmediate") {
      const { opcode, rt, immediate } = parts;
      return tokens.ITypeInstructions[opcode].opcode +
        "00000" +
        tokens.registers[rt] +
        convertImmediateToBinary(immediate, 16);
    } else {
      const { opcode, rt, rs, immediate } = parts;
      return tokens.ITypeInstructions[opcode].opcode +
        tokens.registers[rs] +
        tokens.registers[rt] +
        convertImmediateToBinary(immediate, 16);
    }
  
    
  }

// Function to compile J-Type instructions
function compileJTypeInstruction(instruction) {
    const parts = parser.parseInstruction(instruction);
    
    if (!parts || !parts.label) {
        throw new Error("Invalid J-type instruction format");
    }

    return tokens.JTypeInstructions[parts.opcode].opcode +
           "00".repeat(13); // 26 bit için geçici doldurma
}

// Helper function to convert an immediate value into binary representation
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
    // Pad the binary value to the specified length
    return binary.padStart(length, '0');
  } catch (error) {
    alert(`Immediate conversion error: ${error.message}`);
    return null;  // Return null in case of conversion error
  }
}
// Helper function to remove comments and extra whitespace from an instruction
function removeCommentsAndWhitespace(instruction) {
  try {
    const trimmedInstruction = instruction.split('#')[0].trim();
    return trimmedInstruction.length > 0 ? trimmedInstruction : null;
  } catch (error) {
    alert(`Failed to remove comments or whitespace. ${error.message}`);
    return null;  // Return null if comment removal fails
  }
}
