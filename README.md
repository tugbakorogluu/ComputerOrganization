# COMP3005 Computer Organization

This repository contains the 32-bit MIPS Simulator with GUI Panel, a project developed as part of the **COMP3005 Computer Organization** course. This project aims to develop a simulator that accurately simulates the MIPS architecture and offers code execution and analysis with a user-friendly graphical interface (GUI).

---

# Project : 32-bit MIPS Simulator with GUI Dashboard

This project is a 32-bit MIPS Simulator with a GUI Panel. This project includes a simulator that accurately simulates the MIPS architecture and offers code execution and analysis with a user-friendly graphical interface (GUI).

## Features

- **Interactive Dashboard:** The GUI panel provides insights into the progress of the simulation by providing real-time visualization of key components including General Purpose Registers (GPR), Program Counter (PC), Hi-Lo Registers, Instruction Memory (IM), and Data Memory (DM).
- **Branching Support:** Full support for both conditional and unconditional branches ensures accurate simulation of branching behavior within the code.
- **Procedure Calls:** The simulator effectively handles procedure calls and implementations, replicating the behavior of functions within the MIPS architecture.
- ### Supported Instructions:\*\*
  - **R-Type:**
    - `add`, `sub`, `and`, `or`,
    - `sll`, `srl`,
    - `slt`,
  - **I-Type:**
    - `addi`,
    - `lw`, `sw`,
    - `beq`, `bne`,
  - **J-Type:**
    - `j`, `jal`, `jr`
- **User-Friendly GUI:** The graphical interface enables code input, observation of registers, memory inspection, and other essential fields, making the simulation process user-friendly.
- **Memory Capacity:** With total of 1KB allocated for both data and instruction memory, you can explore and visualize their contents directly within the GUI.

In summary, Project I presents a 32-bit MIPS Simulator with a user-friendly GUI Dashboard. This tool accurately replicates 32-bit MIPS architecture, offers a simple platform to run and understand code, supports various instructions including branching, and provides an accessible platform for code execution and analysis. It's a great way to explore and visualize MIPS operations.

## Requirements

- **Programming Language:** The project was developed using JavaScript.
- **GUI Framework:** Bootstrap and HTML/CSS were used.
- **Operating Environment:** It can run on Windows, Linux and macOS, regardless of platform.

---

## Installation and Operation

1. Clone the repository:

   ```bash
   git clone https://github.com/tugbakorogluu/ComputerOrganization.git
   ```

   2.Install the required dependencies::

   ```bash
   npm install

   ```

   3.Start the application:

   ```bash
   npm start

   ```
