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

convertToBinButton.addEventListener("click", () => {
  const assemblyCode = editor.value.split("\n").map(line => line.trim()); // Trim whitespaces

  if (assemblyCode.length === 0 || assemblyCode.every(line => line === "")) {
    alert("Error: No code provided!");  // Show error message in alert
    return;
  }
  const machineCode = compileToBin(assemblyCode);
  displayMachineCode(machineCode);


}
);

convertToHexButton.addEventListener("click", () => {
  const assemblyCode = editor.value.split("\n").map(line => line.trim()); // Trim whitespaces

  if (assemblyCode.length === 0 || assemblyCode.every(line => line === "")) {
    alert("Error: No code provided!");  // Show error message in alert
    return;
  }
  const machineCode = compileToHex(assemblyCode);
  displayMachineCode(machineCode);


}
);
