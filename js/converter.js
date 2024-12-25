// Import the functions for compiling to binary and hexadecimal machine code.
import { compileToBin, compileToHex } from "./compiler.js";
// Get references to HTML elements.
const editor = document.getElementById("editor");
const convertToBinButton = document.getElementById("convertToBin");
const outputDiv = document.getElementById("output");

// Function to display the machine code in the output section.
function displayMachineCode(machineCode) {
  outputDiv.innerHTML = "";
  machineCode.forEach((code, index) => {
    const line = document.createElement("p");
    line.textContent = `Instruction ${index + 1}: ${code}`;
    outputDiv.appendChild(line);
  });
}
// Event listener for the 'Convert to Binary' button.
convertToBinButton.addEventListener("click", () => {
  // Clear Spaces
  const assemblyCode = editor.value.split("\n").map(line => line.trim());
  try {
    const machineCode = compileToBin(assemblyCode);
    displayMachineCode(machineCode);
  } catch (error) {
    outputDiv.textContent = `Error: ${error.message}`;
  }
});
// Event listener for the 'Convert to Hex' button.
convertToHexButton.addEventListener("click", () => {
   // Clear Spaces
  const assemblyCode = editor.value.split("\n").map(line => line.trim());
  try {
    const machineCode = compileToHex(assemblyCode);
    displayMachineCode(machineCode);
  } catch (error) {
    outputDiv.textContent = `Error: ${error.message}`;
  }
});
