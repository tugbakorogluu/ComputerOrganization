document.addEventListener("DOMContentLoaded", () => {
  const registers = Array(32).fill(0); // Tüm register değerlerini sıfırla
  const memory = Array(1024).fill(0); // Belleği sıfırla
  let instructions = []; // Yüklenecek talimatlar
  let currentStep = 0; // Şu anki talimatın adımı
  let programCounter = 0; // Program sayacı

  const registersContainer = document.getElementById("registers");
  const memoryContainer = document.getElementById("memory");
  const instructionsContainer = document.getElementById("instructions");

  const renderRegisters = () => {
    console.log("Rendering registers:", registers);
    registersContainer.innerHTML = registers
      .map(
        (value, index) =>
          `<div class="p-2 border rounded">$${index}: ${value}</div>`
      )
      .join("");
  };

  const renderMemory = () => {
    console.log("Rendering memory:", memory);
    memoryContainer.innerHTML = memory
      .map((value, index) =>
        value !== 0 ? `<div class="p-2 border-b">${index}: ${value}</div>` : ""
      )
      .join("");
  };

  const renderInstructions = () => {
    console.log(
      "Rendering instructions:",
      instructions,
      "Current step:",
      currentStep
    );
    instructionsContainer.innerHTML = instructions
      .map(
        (inst, index) =>
          `<div class="p-2 rounded ${
            index === currentStep ? "bg-blue-100" : ""
          }">0x${(index * 4).toString(16).padStart(8, "0")}: ${inst}</div>`
      )
      .join("");
  };

  const resetSimulation = () => {
    console.log("Resetting simulation...");
    registers.fill(0);
    memory.fill(0);

    // Başlangıç register değerlerini ayarla
    registers[2] = 10; // Örnek: $2 = 10
    registers[3] = 20; // Örnek: $3 = 20
    registers[5] = 15; // Örnek: $5 = 15
    registers[6] = 5; // Örnek: $6 = 5

    currentStep = 0;
    programCounter = 0;
    renderRegisters();
    renderMemory();
    renderInstructions();
  };

  const executeInstruction = (instruction) => {
    console.log("Executing instruction:", instruction);
    const parts = instruction.split(" ");
    const op = parts[0];
    const rd = parseInt(parts[1].replace("$", ""), 10);
    const rs = parseInt(parts[2].replace("$", ""), 10);
    const rt = parts.length > 3 ? parseInt(parts[3].replace("$", ""), 10) : 0;

    console.log("Operation:", op, "rd:", rd, "rs:", rs, "rt:", rt);

    switch (op) {
      case "ADD":
        registers[rd] = registers[rs] + registers[rt];
        console.log(
          `ADD executed: registers[$${rd}] = ${registers[rs]} + ${registers[rt]}`
        );
        break;
      case "SUB":
        registers[rd] = registers[rs] - registers[rt];
        console.log(
          `SUB executed: registers[$${rd}] = ${registers[rs]} - ${registers[rt]}`
        );
        break;
      case "LW":
        registers[rd] = memory[registers[rs] + rt];
        console.log(
          `LW executed: registers[$${rd}] = memory[${registers[rs]} + ${rt}]`
        );
        break;
      case "SW":
        memory[registers[rs] + rt] = registers[rd];
        console.log(
          `SW executed: memory[${registers[rs]} + ${rt}] = ${registers[rd]}`
        );
        break;
      default:
        console.error(`Unknown instruction: ${instruction}`);
    }
  };

  const executeStep = () => {
    if (currentStep >= instructions.length) {
      console.log("No more instructions to execute.");
      return;
    }

    const instruction = instructions[currentStep];
    console.log(`Executing step ${currentStep + 1}:`, instruction);

    executeInstruction(instruction);

    currentStep++;
    programCounter += 4;

    console.log("Registers after execution:", registers);
    console.log("Memory after execution:", memory);

    renderRegisters(); // Güncellenen register değerlerini göster
    renderMemory(); // Eğer memory değiştiyse güncelle
    renderInstructions(); // Şu anki adımı işaretle
  };

  document.getElementById("stepButton").addEventListener("click", executeStep);
  document
    .getElementById("resetButton")
    .addEventListener("click", resetSimulation);

  // Örnek bir program yükle
  instructions = [
    "ADD $1 $2 $3", // $1 = $2 + $3
    "SUB $4 $5 $6", // $4 = $5 - $6
    "LW $7 $8 0", // $7 = memory[$8 + 0]
    "SW $9 $10 4", // memory[$10 + 4] = $9
  ];

  console.log("Initial instructions:", instructions);

  renderInstructions();
  resetSimulation();
});
