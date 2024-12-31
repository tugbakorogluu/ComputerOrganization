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
    this.labels = new Map(); // Etiketleri ve konumlarını tutacak
    this.skipNextInstruction = false; // beq için kontrol
  }

  // input: 32bit machine code array in binary format
  setIM(assemblyCode, binMachineCode) {
    try {
      this.IM_len = binMachineCode.length;
      
      // Etiketleri topla
      assemblyCode.forEach((instruction, index) => {
        if (instruction.includes(':')) {
          const label = instruction.split(':')[0].trim();
          this.labels.set(label, index);
        }
      });

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
        const jumped = this.execute(); // execute'dan dönüş değerini al

        // Eğer beq ile bir label'a atladıysak, yeni konumdan devam et
        if (jumped) {
          return {
            instruction: this.instr_asm,
            changes: {
              registers: {},
              memory: {},
            },
            jumped: true
          };
        }

        // Let's find the changed register and memory values
        const changes = {
          registers: {},
          memory: {},
        };

        // Check register changes
        for (let i = 0; i < this.reg.length; i++) {
          if (this.reg[i] !== prevRegisters[i]) {
            changes.registers[i] = {
              old: "0x" + this.toHexString(prevRegisters[i], 8),
              new: "0x" + this.toHexString(this.reg[i], 8),
            };
          }
        }

        // Check memory changes
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
          jumped: false
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
          return false;
        case "000100":
          return this.beq();
        case "000101":
          return this.bne();
        case "001000":
          this.addi();
          return false;
        case "100011":
          this.lw();
          return false;
        case "101011":
          this.sw();
          return false;
        case "000010":
          this.j();
          return false;
        case "000011":
          this.jal();
          return false;
        default:
          throw new Error(`Unsupported opcode: ${this.opcode}`);
      }
    } catch (error) {
      alert(`Error in execute: ${error.message}`);
      return false;
    }
  }

  // New method: Returns current step information
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

  // R-Type and other supported methods are included here
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
        // Label'ı bul
        const parts = parser.parseInstruction(this.instr_asm);
        const targetLabel = parts.label;
        
        if (this.labels.has(targetLabel)) {
          // Label'ın konumuna atla ve devam et
          const targetIndex = this.labels.get(targetLabel);
          this.pc = targetIndex * 4;
          // PC'yi güncelle ama programı sonlandırma
          return true; // Label'a atladığımızı belirt
        } else {
          throw new Error(`Label not found: ${targetLabel}`);
        }
      }
      return false; // Normal akışa devam et
    } catch (error) {
      alert(`Error in beq: ${error.message}`);
      return false;
    }
  }
  

// Yardımcı fonksiyon: Offset değerine karşılık gelen label'ı bul
findLabelByOffset(offset) {
    // Program içindeki tüm etiketleri ve konumlarını tutan bir harita
    const labelMap = this.program.reduce((map, instruction, index) => {
        if (instruction.label) {
            map[instruction.label] = index;
        }
        return map;
    }, {});
    
    // Offset değerine göre hedef etiketi bul
    const targetIndex = (this.pc >>> 2) + offset;
    
    for (const [label, position] of Object.entries(labelMap)) {
        if (position === targetIndex) {
            return label;
        }
    }
    
    return null;
}

  bne() {
    try {
        if (this.reg[this.rs] !== this.reg[this.rt]) {
            // Label'ı bul
            const parts = parser.parseInstruction(this.instr_asm);
            const targetLabel = parts.label;
            
            if (this.labels.has(targetLabel)) {
                // Label'ın konumuna atla
                const targetIndex = this.labels.get(targetLabel);
                this.pc = targetIndex * 4;
                return true; // Label'a atladığımızı belirt
            } else {
                throw new Error(`Label not found: ${targetLabel}`);
            }
        }
        return false; // Normal akışa devam et
    } catch (error) {
        alert(`Error in bne: ${error.message}`);
        return false;
    }
  }

  addi() {
    try {
      this.reg[this.rt] = this.reg[this.rs] + this.imm;
    } catch (error) {
      alert(`Error in addi: ${error.message}`);
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

 
  sw() {
    try {
      const address = this.reg[this.rs] + this.imm;
      this.DM[Math.floor(address / 4)] = this.reg[this.rt];
    } catch (error) {
      alert(`Error in sw: ${error.message}`);
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
