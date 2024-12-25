import { compileToBin, compileToHex } from "./compiler.js";

const editor = document.getElementById("editor");

const convertToBinButton = document.getElementById("convertToBin");
const convertToHexButton = document.getElementById("convertToHex");
const outputDiv = document.getElementById("output");

function displayMachineCode(machineCode) {
  outputDiv.innerHTML = "";
  machineCode.forEach((code, index) => {
    const line = document.createElement("p");
    line.textContent = `Instruction ${index + 1}: ${code}`;
    outputDiv.appendChild(line);
  });
}

function preprocessAssemblyCode(input) {
  return input
    .split("\n")
    .map(line => line.trim()) // Her satırın başındaki ve sonundaki boşlukları sil
    .filter(line => line.length > 0); // Boş satırları kaldır
}

convertToBinButton.addEventListener("click", () => {
  const assemblyCode = preprocessAssemblyCode(editor.value);
  try {
    const machineCode = compileToBin(assemblyCode);
    displayMachineCode(machineCode);
  } catch (error) {
    outputDiv.textContent = `Error: ${error.message}`;
  }
});

convertToHexButton.addEventListener("click", () => {
  const assemblyCode = preprocessAssemblyCode(editor.value);
  try {
    const machineCode = compileToHex(assemblyCode);
    displayMachineCode(machineCode);
  } catch (error) {
    outputDiv.textContent = `Error: ${error.message}`;
  }
});
