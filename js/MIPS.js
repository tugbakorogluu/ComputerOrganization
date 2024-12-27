import * as parser from "./parser.js";

export class MIPS {
  constructor() {
    this.reg = new Int32Array(32).fill(0);
    this.IM = new Array(256);
    this.IM_asm = new Array(256);
    this.IM_len = 0;
    this.DM = new Int32Array(256).fill(0);
    this.pc = 0;
    this.hi = 0;
    this.lo = 0;
    this.instr = null;
    this.instr_asm = null;
    this.opcode = null;
    this.rs = 0;
    this.rt = 0;
    this.rd = 0;
    this.shamt = 0;
    this.funct = null;
    this.imm = 0;
    this.target = 0;
    this.labels = {};
  }

  setIM(assemblyCode, binMachineCode) {
    this.IM_len = binMachineCode.length;
    this.labels = parser.collectLabels(assemblyCode);
    for (let i = 0; i < assemblyCode.length; i++) {
      this.IM_asm[i] = assemblyCode[i];
    }
    for (let i = 0; i < binMachineCode.length; i++) {
      this.IM[i] = binMachineCode[i];
    }
  }

  fetch() {
    if (this.pc >= this.IM_len * 4) {
      console.log("Program counter (pc) exceeded instruction memory.");
      return false;
    }
    this.instr = this.IM[this.pc / 4];
    this.instr_asm = this.IM_asm[this.pc / 4];
    return true;
  }

  step() {
    if (!this.fetch()) {
      return null;
    }

    // Store current state
    const oldRegisters = [...this.reg];
    const oldMemory = [...this.DM];
    const currentInstruction = this.instr_asm;
    const currentPC = this.pc;

    // Execute instruction
    this.parseMachineCode();
    this.execute(currentPC);

    // Track changes
    const changes = {
      registers: {},
      memory: {},
      pc: this.pcToHex(),
    };

    // Check register changes
    for (let i = 0; i < this.reg.length; i++) {
      if (this.reg[i] !== oldRegisters[i]) {
        changes.registers[i] = {
          old: "0x" + oldRegisters[i].toString(16).padStart(8, "0"),
          new: "0x" + this.reg[i].toString(16).padStart(8, "0"),
        };
      }
    }

    // Check memory changes
    for (let i = 0; i < this.DM.length; i++) {
      if (this.DM[i] !== oldMemory[i]) {
        changes.memory[i] = {
          old: "0x" + oldMemory[i].toString(16).padStart(8, "0"),
          new: "0x" + this.DM[i].toString(16).padStart(8, "0"),
        };
      }
    }

    return {
      instruction: currentInstruction,
      changes: changes,
    };
  }

  runUntilEnd() {
    let running = true;
    while (running) {
      if (!this.fetch()) {
        running = false;
        break;
      }
      const currentPC = this.pc;
      this.parseMachineCode();
      this.execute(currentPC);
    }
    return this.getState();
  }

  parseMachineCode() {
    this.opcode = this.instr.slice(0, 6);
    this.rs = parseInt(this.instr.slice(6, 11), 2);
    this.rt = parseInt(this.instr.slice(11, 16), 2);
    this.rd = parseInt(this.instr.slice(16, 21), 2);
    this.shamt = parseInt(this.instr.slice(21, 26), 2);
    this.funct = this.instr.slice(26, 32);

    if (this.opcode === "000000") { // R-type
      this.imm = 0;
    } else if (this.opcode === "000010" || this.opcode === "000011") { // J-type
      this.target = parseInt(this.instr.slice(6, 32), 2);
    } else { // I-type
      const immBits = this.instr.slice(16, 32);
      // Sign extension için düzeltme
      const signBit = immBits.charAt(0);
      this.imm = parseInt(immBits, 2);
      if (signBit === '1') {
        this.imm = this.imm - (1 << 16);
      }
    }
  }
  execute(currentPC) {
    let nextPC = currentPC + 4; // Default next PC value

    switch (this.opcode) {
      case "000000": // R-type
        switch (this.funct) {
          case "100000": // ADD
            this.add();
            break;
          case "100010": // SUB
            this.sub();
            break;
          case "100100": // AND
            this.and();
            break;
          case "100101": // OR
            this.or();
            break;
          case "101010": // SLT
            this.slt();
            break;
          case "001000": // JR
            nextPC = this.reg[this.rs];
            break;
          case "000000": // SLL
            this.sll();
            break;
          case "000010": // SRL
            this.srl();
            break;
            default:
              throw new Error(`Unsupported function code: ${this.funct}`);
        }

        break;
        case "000100": // BEQ
            if (this.reg[this.rs] === this.reg[this.rt]) {
                // imm değeri zaten doğru şekilde hesaplanmış olmalı
                nextPC = currentPC + 4 + (this.imm << 2);
            }
            break;
        case "000101": // BNE
            if (this.reg[this.rs] !== this.reg[this.rt]) {
                // imm değeri zaten doğru şekilde hesaplanmış olmalı
                nextPC = currentPC + 4 + (this.imm << 2);
            }
            break;

      case "000100":
        this.beq();
        break;
      case "000101":
        this.bne();
        break;  
      case "001000": // ADDI
        this.addi();
        break;

      case "100011": // LW
        this.lw();
        break;

      case "101011": // SW
        this.sw();
        break;

      case "000010": // J - Düzeltilmiş implementasyon
      nextPC = ((currentPC + 4) & 0xf0000000) | (this.target << 2);
      break;

      case "000011": // JAL - Düzeltilmiş implementasyon
        this.reg[31] = currentPC + 8;
        nextPC = ((currentPC + 4) & 0xf0000000) | (this.target << 2);
        break;
    }
        // Program counter güncelleme
        this.pc = nextPC >>> 0; // Unsigned 32-bit olarak sakla
        return nextPC;
  }
  
  // Instruction implementations
  add() {
    this.reg[this.rd] = this.reg[this.rs] + this.reg[this.rt];
  }

  addi() {
    this.reg[this.rt] = this.reg[this.rs] + this.imm;
  }

  jr() {
    try {
      this.pc = this.reg[this.rs] >>> 0; // unsigned
    } catch (error) {
      alert(`Error in jr: ${error.message}`);
    }
  }

  j() {
    try {
      this.pc = this.target;
    } catch (error) {
      alert(`Error in j: ${error.message}`);
    }
  }

  jal() {
    try {
      this.reg[31] = this.pc;
      this.pc = this.target;
    } catch (error) {
      alert(`Error in jal: ${error.message}`);
    }
  }

  beq() {
  }

  bne() {
  }

  sub() {
    this.reg[this.rd] = this.reg[this.rs] - this.reg[this.rt];
  }

  and() {
    this.reg[this.rd] = this.reg[this.rs] & this.reg[this.rt];
  }

  or() {
    this.reg[this.rd] = this.reg[this.rs] | this.reg[this.rt];
  }

  slt() {
    this.reg[this.rd] = this.reg[this.rs] < this.reg[this.rt] ? 1 : 0;
  }

  sll() {
    this.reg[this.rd] = this.reg[this.rt] << this.shamt;
  }

  srl() {
    this.reg[this.rd] = this.reg[this.rt] >>> this.shamt;
  }

  lw() {
    const address = this.reg[this.rs] + this.imm;
    this.reg[this.rt] = this.DM[address >> 2];
  }

  sw() {
    const address = this.reg[this.rs] + this.imm;
    this.DM[address >> 2] = this.reg[this.rt];
  }

  getState() {
    return {
      registers: this.regToHex(),
      memory: this.DMToHex(),
      pc: this.pcToHex(),
      hi: this.hiToHex(),
      lo: this.loToHex(),
    };
  }

  regToHex() {
    return this.reg.map((val) => "0x" + this.toHexString(val, 8));
  }

  DMToHex() {
    return Array.from(this.DM).map((val) => "0x" + this.toHexString(val, 8));
  }

  pcToHex() {
    return "0x" + this.toHexString(this.pc, 8);
  }

  hiToHex() {
    return "0x" + this.toHexString(this.hi, 8);
  }

  loToHex() {
    return "0x" + this.toHexString(this.lo, 8);
  }

  toHexString(num, length) {
    const hex = (num >>> 0).toString(16).padStart(length, "0");
    return hex;
  }

  // Helper methods for output
  regToHex() {
    return this.reg.map((val) => "0x" + this.toHexString(val, 8));
  }

  DMToHex() {
    return Array.from(this.DM).map((val) => "0x" + this.toHexString(val, 8));
  }

  pcToHex() {
    return "0x" + this.toHexString(this.pc, 8);
  }

  hiToHex() {
    return "0x" + this.toHexString(this.hi, 8);
  }

  loToHex() {
    return "0x" + this.toHexString(this.lo, 8);
  }

  // helper functions
  parseInt32(inputStr, radix) {
    try {
      return this.signedInt(parseInt(inputStr, radix));
    } catch (error) {
      alert(`Error in parseInt32: ${error.message}`);
    }
  }

  signedInt(unsigned) {
    try {
      const uint32Array = new Uint32Array(1);
      uint32Array[0] = unsigned;
      const int32Array = new Int32Array(uint32Array.buffer);
      return int32Array[0];
    } catch (error) {
      alert(`Error in signedInt: ${error.message}`);
    }
  }

  signExtend(inputStr, initialLen, finalLen) {
    try {
      let outputStr = inputStr;
      const signBit = inputStr.charAt(0);
      const signExtension = signBit.repeat(finalLen - initialLen);
      if (initialLen < finalLen) {
        outputStr = signExtension + inputStr;
      } else if (initialLen > finalLen) {
        outputStr = inputStr.slice(initialLen - finalLen);
      }
      return outputStr;
    } catch (error) {
      alert(`Error in signExtend: ${error.message}`);
    }
  }

  toHexString(num, hexLen) {
    try {
      // Get the binary string representation of the number in two's complement form
      const binaryStr = this.toBinString(num, hexLen * 4);

      // Convert the binary string to a hexadecimal string
      const hexStr = parseInt(binaryStr, 2).toString(16);

      // Pad the hexadecimal string with zeros to the desired length
      return hexStr.padStart(hexLen, "0");
    } catch (error) {
      alert(`Error in toHexString: ${error.message}`);
    }
  }

  toBinString(num, binLen) {
    try {
      let binaryStr = num.toString(2); // Convert to binary
      while (binaryStr.length < binLen) {
        binaryStr = "0" + binaryStr;
      }
      return binaryStr;
    } catch (error) {
      alert(`Error in toBinString: ${error.message}`);
    }
  }
}