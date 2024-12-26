import * as tokens from "./tokens.js";

export function parseInstruction(instruction) {
  try {
    const [opcode, ...args] = instruction.trim().split(/\s+/);

    const rTypeInstruction = parseRtype(instruction);
    const iTypeInstruction = parseItype(instruction);
    const jTypeInstruction = parseJtype(instruction);

    if (tokens.RTypeInstructions.hasOwnProperty(opcode) && rTypeInstruction) {
      return rTypeInstruction;
    } else if (
      tokens.ITypeInstructions.hasOwnProperty(opcode) &&
      iTypeInstruction
    ) {
      return iTypeInstruction;
    } else if (
      tokens.JTypeInstructions.hasOwnProperty(opcode) &&
      jTypeInstruction
    ) {
      return jTypeInstruction;
    } else {
      throw new Error(`Invalid instruction: ${instruction}`);
    }
  } catch (error) {
    // Hata mesajını console'a yazdır ve kullanıcıya bildirim yap
    console.error(`Error in parseInstruction: ${error.message}`);
    alert(`Hata: ${error.message}`);  // Hata mesajını alert ile göster
    return null;  // Hata durumunda null döndürebiliriz
  }
}


function parseRtype(instruction) {
  try {
    const rTypeRegex = /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*\$(\w+)$/i;
    const shiftRegex = /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*(\d+|0x[\da-fA-F]+)$/i;
    const jumpRegex = /^jr\s+\$(\w+)$/i;

    const rTypeMatches = instruction.match(rTypeRegex);
    const shiftMatches = instruction.match(shiftRegex);
    const jumpMatches = instruction.match(jumpRegex);

    if (rTypeMatches) {
      const [_, opcode, rd, rs, rt] = rTypeMatches;
      return {
        category: "Register",
        opcode,
        rd: "$" + rd,
        rs: "$" + rs,
        rt: "$" + rt,
      };
    } else if (shiftMatches) {
      const [_, opcode, rd, rt, shamt] = shiftMatches;
      return { category: "Shift", opcode, rd: "$" + rd, rt: "$" + rt, shamt };
    } else if (jumpMatches) {
      const [_, rs] = jumpMatches;
      return { category: "RJump", opcode: "jr", rs: "$" + rs };
    } else {
      return null;
    }
  } catch (error) {
    alert(`Error in parseRtype: ${error.message}`);
    throw error;
  }
}

function parseItype(instruction) {
  try {
    const itypeRegex =
      /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)$/i;
    const loadStoreRegex =
      /^(\w+)\s+\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)\((\$\w+)\)$/i;
    const luiRegex = /^lui\s+\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)$/i;

    const itypeMatches = instruction.match(itypeRegex);
    const loadStoreMatches = instruction.match(loadStoreRegex);
    const luiMatches = instruction.match(luiRegex);

    if (itypeMatches) {
      const [_, opcode, rt, rs, immediate] = itypeMatches;
      return {
        category: "Immediate",
        opcode,
        rt: "$" + rt,
        rs: "$" + rs,
        immediate,
      };
    } else if (loadStoreMatches) {
      const [_, opcode, rt, immediate, rs] = loadStoreMatches;
      return { category: "LoadStore", opcode, rt: "$" + rt, rs, immediate };
    } else if (luiMatches) {
      const [_, rt, immediate] = luiMatches;
      return {
        category: "LoadUpperImmediate",
        opcode: "lui",
        rt: "$" + rt,
        immediate,
      };
    } else {
      return null;
    }
  } catch (error) {
    alert(`Error in parseItype: ${error.message}`);
    throw error;
  }
}

function parseJtype(instruction) {
  try {
    const jTypeRegex = /^(\w+)\s+(\d+|0x[\da-fA-F]+|0b[01]+)$/i;

    const jTypeMatches = instruction.match(jTypeRegex);

    if (jTypeMatches) {
      const [_, opcode, target] = jTypeMatches;
      return { category: "Jump", opcode, target: target };
    } else {
      return null;
    }
  } catch (error) {
    alert(`Error in parseJtype: ${error.message}`);
    throw error;
  }
}
