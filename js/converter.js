import { compileToBin, compileToHex } from "./compiler.js";
// Get the code editor element where assembly code is entered
const editor = document.getElementById("editor");
// Get buttons for converting to binary and hexadecimal
const convertToBinButton = document.getElementById("convertToBin");
const convertToHexButton = document.getElementById("convertToHex");
// Get the output div where the machine code will be displayed
const outputDiv = document.getElementById("output");
// Function to display machine code in the output div
function displayMachineCode(machineCode) {
  outputDiv.innerHTML = "";
  machineCode.forEach((code, index) => {
    const line = document.createElement("p");
    line.textContent = `Instruction ${index + 1}: ${code}`;
    outputDiv.appendChild(line);
  });
}
// Event listener for the "Convert to Binary" button
convertToBinButton.addEventListener("click", () => {
  const assemblyCode = editor.value.split("\n").map(line => line.trim()); // Trim whitespaces
  // Check if the user has provided any code
  if (assemblyCode.length === 0 || assemblyCode.every(line => line === "")) {
    alert("Error: No code provided!");  // Show error message in alert
    return;
  }
  // Compile the assembly code into binary machine code
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
