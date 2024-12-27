import * as compiler from "./js/compiler.js";
import * as MIPS from "./js/MIPS.js";

function init() {
  initializeDMTable();
  initializeIMTable();
  const runBtn = document.querySelector("#run-btn");
  const stepBtn = document.querySelector("#step-btn");
  const resetBtn = document.querySelector("#reset-btn");

  runBtn.addEventListener("click", run);
  stepBtn.addEventListener("click", step);
  resetBtn.addEventListener("click", () => {
    mips = null;
    currentInstructionIndex = 0;
    resetDisplay();
  });
}

window.addEventListener("load", init);

function initializeDMTable() {
  const DM_tableBody = document.querySelector("#data-memory-table tbody");

  for (let i = 0; i < 64; i++) {
    const row = document.createElement("tr");

    const address = document.createElement("th");
    const decimalAddress = i * 16;
    address.textContent = "0x" + decimalAddress.toString(16).padStart(8, "0");
    row.appendChild(address);

    for (let j = 0; j < 4; j++) {
      const value = document.createElement("td");
      const decimalId = (i * 16 + j * 4) / 4;
      value.setAttribute("id", "DM_" + decimalId);
      value.textContent = "0x00000000";
      row.appendChild(value);
    }

    DM_tableBody.appendChild(row);
  }
}

function initializeIMTable() {
  const IM_tableBody = document.querySelector(
    "#instruction-memory-table tbody"
  );

  for (let i = 0; i < 256; i++) {
    const row = document.createElement("tr");

    const address = document.createElement("td");
    address.textContent = "0x" + (i * 4).toString(16).padStart(8, "0");
    row.appendChild(address);

    const code = document.createElement("td");
    code.textContent = "0x00000000";
    code.setAttribute("id", "IM_code_" + i);
    row.appendChild(code);

    const source = document.createElement("td");
    source.setAttribute("id", "IM_source_" + i);
    row.appendChild(source);

    IM_tableBody.appendChild(row);
  }
}

function run() {
  const textarea = document.querySelector("#editor");
  const input = textarea.value.split("\n");
  const assemblyCode = [];
  for (let i = 0; i < input.length; i++) {
    const splittedLine = input[i].split("#");
    const trimmedLine = splittedLine[0].trim();
    if (trimmedLine !== "") {
      assemblyCode.push(trimmedLine);
    }
  }

  const hexMachineCode = compiler.compileToHex(assemblyCode);
  const binMachineCode = compiler.compileToBin(assemblyCode);

  const myMIPS = new MIPS.MIPS();
  myMIPS.setIM(assemblyCode, binMachineCode);
  myMIPS.runUntilEnd();
  const reg = myMIPS.regToHex();
  const DM = myMIPS.DMToHex();
  const pc = myMIPS.pcToHex();
  const hi = myMIPS.hiToHex();
  const lo = myMIPS.loToHex();

  updateTable(hexMachineCode, "#IM_code_", "0x");
  updateTable(assemblyCode, "#IM_source_");
  updateTable(reg, "#reg_");
  updateTable(DM, "#DM_");
  updateElement(pc, "#pc");
  updateElement(hi, "#hi");
  updateElement(lo, "#lo");
}

function updateTable(arr, baseID, prefix = "") {
  for (let i = 0; i < arr.length; i++) {
    const codeElement = document.querySelector(baseID + i);
    codeElement.textContent = prefix + arr[i];
  }
}

function updateElement(val, ID) {
  const codeElement = document.querySelector(ID);
  codeElement.textContent = val;
}

let mips = null;
let currentInstructionIndex = 0;

function initializeSimulator() {
  const textarea = document.querySelector("#editor");
  const input = textarea.value.split("\n");
  const assemblyCode = [];

  for (let i = 0; i < input.length; i++) {
    const splittedLine = input[i].split("#");
    const trimmedLine = splittedLine[0].trim();
    if (trimmedLine !== "") {
      assemblyCode.push(trimmedLine);
    }
  }

  const binMachineCode = compiler.compileToBin(assemblyCode);

  mips = new MIPS.MIPS();
  mips.setIM(assemblyCode, binMachineCode);
  currentInstructionIndex = 0;

  resetDisplay();
}

function resetDisplay() {
  updateTable(new Array(32).fill("00000000"), "#reg_", "0x");
  updateTable(new Array(256).fill("00000000"), "#DM_", "0x");
  updateElement("0x00000000", "#pc");
  updateElement("0x00000000", "#hi");
  updateElement("0x00000000", "#lo");
  document.getElementById("step-output").textContent = "";
}

function step() {
  if (!mips) {
    initializeSimulator();
  }

  const stepResult = mips.step();
  displayStepInfo(stepResult);
}

function displayStepInfo(stepResult) {
  const stepOutput = document.getElementById("step-output");

  if (!stepResult) {
    stepOutput.textContent = "Program execution completed.";
    return;
  }

  let output = `Executing: ${stepResult.instruction}\n`;

  if (Object.keys(stepResult.changes.registers).length > 0) {
    output += "\nRegister changes:\n";
    for (const [reg, values] of Object.entries(stepResult.changes.registers)) {
      const regName = getRegisterName(parseInt(reg));
      output += `$${regName} (${reg}): ${values.old} → ${values.new}\n`;
      document.querySelector(`#reg_${reg}`).textContent = values.new;
    }
  }

  if (Object.keys(stepResult.changes.memory).length > 0) {
    output += "\nMemory changes:\n";
    for (const [addr, values] of Object.entries(stepResult.changes.memory)) {
      output += `Address 0x${(addr * 4).toString(16).padStart(8, "0")}: ${
        values.old
      } → ${values.new}\n`;
      document.querySelector(`#DM_${addr}`).textContent = values.new;
    }
  }

  stepOutput.textContent = output;
}

function getRegisterName(index) {
  const registerNames = [
    "zero",
    "at",
    "v0",
    "v1",
    "a0",
    "a1",
    "a2",
    "a3",
    "t0",
    "t1",
    "t2",
    "t3",
    "t4",
    "t5",
    "t6",
    "t7",
    "s0",
    "s1",
    "s2",
    "s3",
    "s4",
    "s5",
    "s6",
    "s7",
    "t8",
    "t9",
    "k0",
    "k1",
    "gp",
    "sp",
    "fp",
    "ra",
  ];
  return registerNames[index] || `${index}`;
}
