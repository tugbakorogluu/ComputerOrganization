import { compileToBin, compileToHex } from "./compiler.js";

const editor = document.getElementById("editor");

const convertToBinButton = document.getElementById("convertToBin");

const outputDiv = document.getElementById("output");

function displayMachineCode(machineCode) {
  outputDiv.innerHTML = "";
  machineCode.forEach((code, index) => {
    const line = document.createElement("p");
    line.textContent = `Instruction ${index + 1}: ${code}`;
    outputDiv.appendChild(line);
  });
}

convertToBinButton.addEventListener("click", () => {
  const assemblyCode = editor.value.split("\n");
  try {
    const machineCode = compileToBin(assemblyCode);
    displayMachineCode(machineCode);
  } catch (error) {
    outputDiv.textContent = `Error: ${error.message}`;
  }
});

convertToHexButton.addEventListener("click", () => {
  const assemblyCode = assemblyInput.value.split("\n");
  try {
    const machineCode = compileToHex(assemblyCode);
    displayMachineCode(machineCode);
  } catch (error) {
    outputDiv.textContent = `Error: ${error.message}`;
  }
});
