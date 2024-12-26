import * as parser from "./parser.js";

export class MIPS {
  constructor() {
    this.reg = new Int32Array(32).fill(0);
    this.IM = new Array(256); // Binary Machine Code
    this.IM_asm = new Array(256); // Assembly Code
    this.IM_len = 0; // Code Length
    this.DM = new Int32Array(256).fill(0);
    this.pc = 0; // unsigned
    this.hi = 0; // signed
    this.lo = 0; // signed
    this.instr = null; // Binary Machine Code Instruction
    this.instr_asm = null; // Assembly Code Instruction
    this.opcode = null;
    this.rs = 0; // unsigned
    this.rt = 0; // unsigned
    this.rd = 0; // unsigned
    this.shamt = 0; // unsigned
    this.funct = null;
    this.imm = 0; // signed
    this.target = 0; // unsigned
  }

  // input: 32bit machine code array in binary format
  setIM(assemblyCode, binMachineCode) {
    try {
      this.IM_len = binMachineCode.length;
      for (let i = 0; i < assemblyCode.length; i++) {
        this.IM_asm[i] = assemblyCode[i];
      }
      for (let i = 0; i < binMachineCode.length; i++) {
        this.IM[i] = binMachineCode[i];
      }
    } catch (error) {
      alert(`Error in setIM: ${error.message}`);
    }
  }

  // Fetch the next instruction from this.IM
  fetch() {
    try {
      this.instr = this.IM[this.pc / 4];
      this.instr_asm = this.IM_asm[this.pc / 4];
      this.pc += 4;
    } catch (error) {
      alert(`Error in fetch: ${error.message}`);
    }
  }

  // Run the CPU for one cycle
  step() {
    try {
      const prevRegisters = [...this.reg];
      const prevMemory = [...this.DM];

      this.fetch();
      if (this.instr !== undefined) {
        this.parseMachineCode();
        this.execute();

        // Değişen register ve memory değerlerini bulalım
        const changes = {
          registers: {},
          memory: {},
        };

        // Register değişikliklerini kontrol et
        for (let i = 0; i < this.reg.length; i++) {
          if (this.reg[i] !== prevRegisters[i]) {
            changes.registers[i] = {
              old: "0x" + this.toHexString(prevRegisters[i], 8),
              new: "0x" + this.toHexString(this.reg[i], 8),
            };
          }
        }

        // Memory değişikliklerini kontrol et
        for (let i = 0; i < this.DM.length; i++) {
          if (this.DM[i] !== prevMemory[i]) {
            changes.memory[i] = {
              old: "0x" + this.toHexString(prevMemory[i], 8),
              new: "0x" + this.toHexString(this.DM[i], 8),
            };
          }
        }

        return {
          instruction: this.instr_asm,
          changes: changes,
        };
      }
      return null;
    } catch (error) {
      alert(`Error in step: ${error.message}`);
    }
  }

  // Run the CPU for the specified number of cycles
  run(cycles) {
    try {
      if (cycles > this.IM_len) {
        this.runUntilEnd();
      } else {
        for (let i = 0; i < cycles; i++) {
          this.step();
        }
      }
    } catch (error) {
      alert(`Error in run: ${error.message}`);
    }
  }

  runUntilEnd() {
    try {
      while (this.pc < this.IM_len * 4) {
        this.step();
      }
    } catch (error) {
      alert(`Error in runUntilEnd: ${error.message}`);
    }
  }

  parseMachineCode() {
    try {
      this.opcode = this.instr.slice(0, 6);
      this.rs = parseInt(this.instr.slice(6, 11), 2);
      this.rt = parseInt(this.instr.slice(11, 16), 2);
      this.rd = parseInt(this.instr.slice(16, 21), 2);
      this.shamt = parseInt(this.instr.slice(21, 26));
      this.funct = this.instr.slice(26, 32);
      const parts = parser.parseInstruction(this.instr_asm);
      this.imm = this.signedInt(parseInt(parts.immediate));
      this.target = parseInt(this.instr.slice(6, 32), 2) * 4;
    } catch (error) {
      alert(`Error in parseMachineCode: ${error.message}`);
    }
  }

  execute() {
    try {
      switch (this.opcode) {
        case "000000": // R-type instruction
          switch (this.funct) {
            case "100000":
              this.add();
              break;
            case "100010":
              this.sub();
              break;
            case "100100":
              this.and();
              break;
            case "100101":
              this.or();
              break;
            case "101010":
              this.slt();
              break;
            case "001000":
              this.jr();
              break;
            case "000000":
              this.sll();
              break;
            case "000010":
              this.srl();
              break;
            default:
              throw new Error(`Unsupported function code: ${this.funct}`);
          }
          break;
        case "000100":
          this.beq();
          break;
        case "000101":
          this.bne();
          break;
        case "001000":
          this.addi();
          break;
        case "100011":
          this.lw();
          break;
        case "101011":
          this.sw();
          break;
        case "000010":
          this.j();
          break;
        case "000011":
          this.jal();
          break;
        default:
          throw new Error(`Unsupported opcode: ${this.opcode}`);
      }
    } catch (error) {
      alert(`Error in execute: ${error.message}`);
    }
  }

  // Yeni metod: Mevcut adım bilgilerini döndürür
  getCurrentStepInfo() {
    try {
      return {
        instruction: this.instr_asm,
        pc: this.pcToHex(),
        opcode: this.opcode,
        rs: this.rs,
        rt: this.rt,
        rd: this.rd,
        imm: this.imm,
        target: this.target,
        registers: this.regToHex(),
        memory: this.DMToHex(),
      };
    } catch (error) {
      alert(`Error in getCurrentStepInfo: ${error.message}`);
    }
  }

  // R-Type ve diğer desteklenen metodlar burada yer alıyor...
  add() {
    try {
      this.reg[this.rd] = this.reg[this.rs] + this.reg[this.rt];
    } catch (error) {
      alert(`Error in add: ${error.message}`);
    }
  }

  sub() {
    try {
      this.reg[this.rd] = this.reg[this.rs] - this.reg[this.rt];
    } catch (error) {
      alert(`Error in sub: ${error.message}`);
    }
  }

  and() {
    try {
      this.reg[this.rd] = this.reg[this.rs] & this.reg[this.rt];
    } catch (error) {
      alert(`Error in and: ${error.message}`);
    }
  }

  or() {
    try {
      this.reg[this.rd] = this.reg[this.rs] | this.reg[this.rt];
    } catch (error) {
      alert(`Error in or: ${error.message}`);
    }
  }

  slt() {
    try {
      if (this.reg[this.rs] < this.reg[this.rt]) {
        this.reg[this.rd] = 1;
      } else {
        this.reg[this.rd] = 0;
      }
    } catch (error) {
      alert(`Error in slt: ${error.message}`);
    }
  }

  jr() {
    try {
      this.pc = this.reg[this.rs] >>> 0; // unsigned
    } catch (error) {
      alert(`Error in jr: ${error.message}`);
    }
  }

  sll() {
    try {
      this.reg[this.rd] = this.reg[this.rt] << this.shamt;
    } catch (error) {
      alert(`Error in sll: ${error.message}`);
    }
  }

  srl() {
    try {
      this.reg[this.rd] = this.reg[this.rt] >>> this.shamt;
    } catch (error) {
      alert(`Error in srl: ${error.message}`);
    }
  }

  beq() {
    try {
        if (this.reg[this.rs] === this.reg[this.rt]) {
            // PC zaten instruction'ı fetch ettikten sonra 4 artmış durumda
            // Offset'i 4 ile çarp (byte address'e çevirmek için)
            // Ve current PC'ye ekle
            this.pc = (this.pc + (this.imm << 2)) >>> 0;
        }
    } catch (error) {
        alert(`Error in beq: ${error.message}`);
    }
}

bne() {
  try {
    if (this.reg[this.rs] !== this.reg[this.rt]) {
      this.pc += this.imm;
    }
  } catch (error) {
    alert(`Error in bne: ${error.message}`);
  }
}

  addi() {
    try {
      this.reg[this.rt] = this.reg[this.rs] + this.imm;
    } catch (error) {
      alert(`Error in addi: ${error.message}`);
    }
  }

  andi() {
    try {
      this.reg[this.rt] = this.reg[this.rs] & this.imm;
    } catch (error) {
      alert(`Error in andi: ${error.message}`);
    }
  }

  ori() {
    try {
      this.reg[this.rt] = this.reg[this.rs] | this.imm;
    } catch (error) {
      alert(`Error in ori: ${error.message}`);
    }
  }

  lui() {
    try {
      const imm16 = this.imm << 16;
      this.reg[this.rt] = imm16;
    } catch (error) {
      alert(`Error in lui: ${error.message}`);
    }
  }

  lw() {
    try {
      const address = this.reg[this.rs] + this.imm;
      const data = this.DM[Math.floor(address / 4)];
      this.reg[this.rt] = data;
    } catch (error) {
      alert(`Error in lw: ${error.message}`);
    }
}

  lb() {
    try {
      const byteAddr = this.reg[this.rs] + this.imm;
      const wordAddr = byteAddr - (byteAddr % 4);
      const word = this.toBinString(this.DM[wordAddr / 4], 32);
      const start = 2 * (4 - (byteAddr % 4)) - 2; // byte
      const end = 2 * (4 - (byteAddr % 4)); // byte
      const byte = word.slice(start * 4, end * 4);
      this.reg[this.rt] = this.parseInt32(this.signExtend(byte, 8, 32), 2);
    } catch (error) {
      alert(`Error in lb: ${error.message}`);
    }
  }

  sw() {
    try {
      const address = this.reg[this.rs] + this.imm;
      this.DM[Math.floor(address / 4)] = this.reg[this.rt];
    } catch (error) {
      alert(`Error in sw: ${error.message}`);
    }
  }
  sb() {
    try {
      const byteAddr = this.reg[this.rs] + this.imm;
      const wordAddr = byteAddr - (byteAddr % 4);
      const word = this.toHexString(this.DM[wordAddr / 4], 8);
      const start = 2 * (4 - (byteAddr % 4)) - 2; // byte
      const end = 2 * (4 - (byteAddr % 4)); // byte
      const result =
        word.slice(0, start) +
        this.toHexString(this.reg[this.rt], 8).slice(6, 8) +
        word.slice(end, 8);
      this.DM[wordAddr / 4] = this.parseInt32(result, 16);
    } catch (error) {
      alert(`Error in sb: ${error.message}`);
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

  //output functions
  regToHex() {
    try {
      const hexArray = [];
      for (let i = 0; i < this.reg.length; i++) {
        const hexString = "0x" + this.toHexString(this.reg[i], 8);
        hexArray.push(hexString);
      }
      return hexArray;
    } catch (error) {
      alert(`Error in regToHex: ${error.message}`);
    }
  }

  DMToHex() {
    try {
      const hexArray = [];
      for (let i = 0; i < this.DM.length; i++) {
        const hexString = "0x" + this.toHexString(this.DM[i], 8);
        hexArray.push(hexString);
      }
      return hexArray;
    } catch (error) {
      alert(`Error in DMToHex: ${error.message}`);
    }
  }

  pcToHex() {
    try {
      return "0x" + this.toHexString(this.pc, 8);
    } catch (error) {
      alert(`Error in pcToHex: ${error.message}`);
    }
  }

  hiToHex() {
    try {
      return "0x" + this.toHexString(this.hi, 8);
    } catch (error) {
      alert(`Error in hiToHex: ${error.message}`);
    }
  }

  loToHex() {
    try {
      return "0x" + this.toHexString(this.lo, 8);
    } catch (error) {
      alert(`Error in loToHex: ${error.message}`);
    }
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
