import * as tokens from "./tokens.js";

// The `parseInstruction` function analyzes and parses a given MIPS instruction into its category.
export function parseInstruction(instruction) {
  // Split the instruction into opcode (operation code) and arguments by whitespace.
  const [opcode, ...args] = instruction.trim().split(/\s+/);

  // Attempt to parse the instruction as R-type, I-type, or J-type.
  const rTypeInstruction = parseRtype(instruction);
  const iTypeInstruction = parseItype(instruction);
  const jTypeInstruction = parseJtype(instruction);

  //If the instruction matches an R-type and the opcode exists in the R-type set, return the R-type result.
  if (tokens.RTypeInstructions.hasOwnProperty(opcode) && rTypeInstruction) {
    return rTypeInstruction;
  } 
  // If the instruction matches an I-type and the opcode exists in the I-type set, return the I-type result.
  else if (
    tokens.ITypeInstructions.hasOwnProperty(opcode) &&
    iTypeInstruction
  ) {
    return iTypeInstruction;
  }
  // If the instruction matches a J-type and the opcode exists in the J-type set, return the J-type result. 
  else if (
    tokens.JTypeInstructions.hasOwnProperty(opcode) &&
    jTypeInstruction
  ) {
    return jTypeInstruction;
  } else 
  // If the instruction doesn't match any type, throw an error.
  {
    throw new Error(`Invalid instruction: ${instruction}`);
  }
}
  // Parses R-type instructions.
function parseRtype(instruction) {
  // General format for R-type instructions: <opcode> $rd, $rs, $rt
  const rTypeRegex = /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*\$(\w+)$/i;
  // Format for shift instructions: <opcode> $rd, $rt, <shamt>
  const shiftRegex = /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*(\d+|0x[\da-fA-F]+)$/i;
  // Format for the `jr` (jump register) instruction: jr $rs
  const jumpRegex = /^jr\s+\$(\w+)$/i;

  // Match the instruction against R-type formats.
  const rTypeMatches = instruction.match(rTypeRegex);
  const shiftMatches = instruction.match(shiftRegex);
  const jumpMatches = instruction.match(jumpRegex);

  // General R-type instruction
  if (rTypeMatches) {
    const [_, opcode, rd, rs, rt] = rTypeMatches;
    return {
      category: "Register",
      opcode,
      rd: "$" + rd,
      rs: "$" + rs,
      rt: "$" + rt,
    };
  // Shift instruction  
  } else if (shiftMatches) {
    const [_, opcode, rd, rt, shamt] = shiftMatches;
    return { category: "Shift", opcode, rd: "$" + rd, rt: "$" + rt, shamt };
  } 
  // Jump register (`jr`) instruction
    else if (jumpMatches) {
    const [_, rs] = jumpMatches;
    return { category: "RJump", opcode: "jr", rs: "$" + rs };
  } 
  // If no format matches, return null.
    else {
    return null;
  }
}
// Parses I-type instructions.
function parseItype(instruction) {
  // General I-type format: <opcode> $rt, $rs, <immediate>
  const itypeRegex =
    /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)$/i;
  // Load/store format: <opcode> $rt, <offset>($rs)
  const loadStoreRegex =
    /^(\w+)\s+\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)\((\$\w+)\)$/i;
  // `lui` format: lui $rt, <immediate>
  const luiRegex = /^lui\s+\$(\w+),\s*(-?\d+|0x[\da-fA-F]+|0b[01]+)$/i;


  // Match the instruction against I-type formats.
  const itypeMatches = instruction.match(itypeRegex);
  const loadStoreMatches = instruction.match(loadStoreRegex);
  const luiMatches = instruction.match(luiRegex);

  // General I-type instruction
  if (itypeMatches) {
    const [_, opcode, rt, rs, immediate] = itypeMatches;
    return {
      category: "Immediate",
      opcode,
      rt: "$" + rt,
      rs: "$" + rs,
      immediate,
    };
  // Load/store instruction  
  } else if (loadStoreMatches) {
    const [_, opcode, rt, immediate, rs] = loadStoreMatches;
    return { category: "LoadStore", opcode, rt: "$" + rt, rs, immediate };
  // Load upper immediate (`lui`) instruction
  } else if (luiMatches) {
    const [_, rt, immediate] = luiMatches;
    return {
      category: "LoadUpperImmediate",
      opcode: "lui",
      rt: "$" + rt,
      immediate,
    };
  } 
    // If no format matches, return null.
    else {
    return null;
  }
}
// Parses J-type instructions.
function parseJtype(instruction) {
  // General format for J-type instructions: <opcode> <target>
  const jTypeRegex = /^(\w+)\s+(\d+|0x[\da-fA-F]+|0b[01]+)$/i;
  // Match the instruction against the J-type format.
  const jTypeMatches = instruction.match(jTypeRegex);
  // If the format matches, return the parsed result.
  if (jTypeMatches) {
    const [_, opcode, target] = jTypeMatches;
    return { category: "Jump", opcode, target: target };
  } 
   // If no format matches, return null.
    else {
    return null;
  }
}
