import * as tokens from "./tokens.js";

export function parseInstruction(instruction) {
  // First handle any labels in the instruction
  const labelMatch = instruction.match(/^(\w+):\s*(.*)$/);
  if (labelMatch) {
    // If there's only a label with no instruction, return null
    if (!labelMatch[2].trim()) {
      return null;
    }
    // Otherwise parse the actual instruction part
    instruction = labelMatch[2].trim();
  }

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
}

export function collectLabels(assemblyCode) {
  const labels = {};
  let currentAddress = 0;

  assemblyCode.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      const labelMatch = trimmedLine.match(/^(\w+):/);
      if (labelMatch) {
        labels[labelMatch[1]] = currentAddress;
        // Only increment address if there's an actual instruction after the label
        const instructionAfterLabel = trimmedLine
          .substring(labelMatch[0].length)
          .trim();
        if (instructionAfterLabel && !instructionAfterLabel.startsWith("#")) {
          currentAddress += 4;
        }
      } else if (!trimmedLine.startsWith("#")) {
        currentAddress += 4;
      }
    }
  });

  return labels;
}

function parseRtype(instruction) {
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
    return {
      category: "Shift",
      opcode,
      rd: "$" + rd,
      rt: "$" + rt,
      shamt,
    };
  } else if (jumpMatches) {
    const [_, rs] = jumpMatches;
    return {
      category: "RJump",
      opcode: "jr",
      rs: "$" + rs,
    };
  } else {
    return null;
  }
}

function parseItype(instruction) {
  const itypeRegex =
    /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+|\w+)$/i;
  const loadStoreRegex =
    /^(\w+)\s+\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)\((\$\w+)\)$/i;
  const luiRegex = /^lui\s+\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)$/i;
  const branchRegex = /^(beq|bne)\s+\$(\w+),\s*\$(\w+),\s*(\w+)$/i;

  const itypeMatches = instruction.match(itypeRegex);
  const loadStoreMatches = instruction.match(loadStoreRegex);
  const luiMatches = instruction.match(luiRegex);
  const branchMatches = instruction.match(branchRegex);

  if (branchMatches) {
    const [_, opcode, rs, rt, label] = branchMatches;
    return {
      category: "Branch",
      opcode,
      rs: "$" + rs,
      rt: "$" + rt,
      immediate: label,
      isLabel: true,
    };
  } else if (itypeMatches) {
    const [_, opcode, rt, rs, immediate] = itypeMatches;
    return {
      category: "Immediate",
      opcode,
      rt: "$" + rt,
      rs: "$" + rs,
      immediate,
      isLabel: false,
    };
  } else if (loadStoreMatches) {
    const [_, opcode, rt, immediate, rs] = loadStoreMatches;
    return {
      category: "LoadStore",
      opcode,
      rt: "$" + rt,
      rs,
      immediate,
      isLabel: false,
    };
  } else if (luiMatches) {
    const [_, rt, immediate] = luiMatches;
    return {
      category: "LoadUpperImmediate",
      opcode: "lui",
      rt: "$" + rt,
      immediate,
      isLabel: false,
    };
  } else {
    return null;
  }
}

function parseJtype(instruction) {
  const jTypeRegex = /^(\w+)\s+(\w+|\d+|0x[\da-fA-F]+|0b[01]+)$/i;
  const jTypeMatches = instruction.match(jTypeRegex);

  if (jTypeMatches) {
    const [_, opcode, target] = jTypeMatches;
    const isLabel =
      isNaN(target) && !target.startsWith("0x") && !target.startsWith("0b");
    return {
      category: "Jump",
      opcode,
      target,
      isLabel,
    };
  } else {
    return null;
  }
}
