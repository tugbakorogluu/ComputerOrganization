import * as tokens from "./tokens.js";
// Main function to parse an assembly instruction and determine its type (R-type, I-type, or J-type)
export function parseInstruction(instruction) {
    // Split the instruction into opcode and arguments
    const [opcode, ...args] = instruction.trim().split(/\s+/);
  // Parse the instruction using specialized functions for R-type, I-type, and J-type instructions
    const rTypeInstruction = parseRtype(instruction);
    const iTypeInstruction = parseItype(instruction);
    const jTypeInstruction = parseJtype(instruction);
  // Check if the instruction matches a known R-type, I-type, or J-type opcode and return the parsed result
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


// Function to parse R-type instructions
function parseRtype(instruction) {
  
    const rTypeRegex = /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*\$(\w+)$/i;
    const shiftRegex = /^(\w+)\s+\$(\w+),\s*\$(\w+),\s*(\d+|0x[\da-fA-F]+)$/i;
    const jumpRegex = /^jr\s+\$(\w+)$/i;
    // Match the instruction against the regular expressions
    const rTypeMatches = instruction.match(rTypeRegex);
    const shiftMatches = instruction.match(shiftRegex);
    const jumpMatches = instruction.match(jumpRegex);
    // Parse the instruction based on the matching pattern
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
  } 
// Function to parse I-type instructions
function parseItype(instruction) {
  
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
  }
// Function to parse J-type instructions
function parseJtype(instruction) {
    // Regular expression for J-type instructions
    const jTypeRegex = /^(\w+)\s+(\d+|0x[\da-fA-F]+|0b[01]+)$/i;

    const jTypeMatches = instruction.match(jTypeRegex);
  // Parse the instruction if a match is found
    if (jTypeMatches) {
      const [_, opcode, target] = jTypeMatches;
      return { category: "Jump", opcode, target: target };
    } else {
      return null;
    }
  
  }
