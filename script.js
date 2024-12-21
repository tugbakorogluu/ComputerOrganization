import * as compiler from './js/compiler.js';
import * as MIPS from './js/MIPS.js';

/* Sayfa yüklendiğinde (load olayında) init fonksiyonu çağrılır.
initializeDMTable() ve initializeIMTable() fonksiyonları ile veri ve komut hafızası tabloları hazırlanır.
Kullanıcı "Run" butonuna tıkladığında run() fonksiyonu çalışacak şekilde bir olay dinleyicisi (click) eklenir. */
function init() {
  initializeDMTable();
  initializeIMTable();
  const runBtn = document.querySelector("#run-btn");
  runBtn.addEventListener("click", run);
}

window.addEventListener("load", init);

/* Bu fonksiyon, veri hafızası tablosunu (data-memory-table) oluşturur ve her satırda hafıza adresini ve 
değerini (başlangıçta 0x00000000) gösterir. 
64 satırlık bir tablo oluşturulur. Her satırda, adres ve 4 hücrelik veri alanı bulunur.
Her hücreye benzersiz bir ID atanır (örneğin, DM_0, DM_1 vb.) ve her değeri 0x00000000 olarak ayarlanır.*/
function initializeDMTable() {
  const DM_tableBody = document.querySelector("#data-memory-table tbody");

  for (let i = 0; i < 64; i++) {
    const row = document.createElement("tr");

    const address = document.createElement("th");
    const decimalAddress = (i * 16);
    address.textContent = "0x" + decimalAddress.toString(16).padStart(8, '0');
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

/* Bu fonksiyon, komut hafızası tablosunu (instruction-memory-table) oluşturur ve her satırda hafıza adresi, 
kod (başlangıçta 0x00000000), ve kaynak gösterilir. 
256 satırdan oluşur. Her satırda, bir address, bir code ve bir source hücresi bulunur.*/
function initializeIMTable() {
  const IM_tableBody = document.querySelector("#instruction-memory-table tbody");

  for (let i = 0; i < 256; i++) {
    const row = document.createElement("tr");

    const address = document.createElement("td");
    address.textContent = "0x" + (i * 4).toString(16).padStart(8, '0');
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

/* Kullanıcı tarafından yazılan assembly kodunu textarea alanından alır ve satırlara böler.
Assembly kodunu derler ve makine koduna (hexMachineCode ve binMachineCode) dönüştürür.
MIPS sınıfı ile bu makine kodunu çalıştırır ve işlemci durumunu günceller.
regToHex(), DMToHex(), pcToHex(), hiToHex(), ve loToHex() fonksiyonları ile işlemcinin durumu (register'lar, veri hafızası, 
program sayacı vb.) hexadecimal formata dönüştürülür.
Bu veriler updateTable ve updateElement fonksiyonları ile uygun HTML elementlerine aktarılır ve tabloya yazdırılır. */
function run() {
  // Get assembly code from textarea
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

  // Compile assembly code to machine code
  const hexMachineCode = compiler.compileToHex(assemblyCode);
  const binMachineCode = compiler.compileToBin(assemblyCode);

  // Run the machine code
  const myMIPS = new MIPS.MIPS();
  myMIPS.setIM(assemblyCode, binMachineCode);
  myMIPS.runUntilEnd();
  const reg = myMIPS.regToHex();
  const DM = myMIPS.DMToHex();
  const pc = myMIPS.pcToHex();
  const hi = myMIPS.hiToHex();
  const lo = myMIPS.loToHex();

  // Display the data in tables
  updateTable(hexMachineCode, "#IM_code_", "0x");
  updateTable(assemblyCode, "#IM_source_");
  updateTable(reg, "#reg_");
  updateTable(DM, "#DM_");
  updateElement(pc, "#pc");
  updateElement(hi, "#hi");
  updateElement(lo, "#lo");
}

/*  Bu fonksiyon, verilen arr dizisini, baseID ile başlayan HTML elementlerine yerleştirir.
Her eleman, prefix (isteğe bağlı) ile başlatılır ve ilgili hücreye yazılır. Örneğin, 0x gibi bir ön ek eklenebilir. */
function updateTable(arr, baseID, prefix = "") {
  for (let i = 0; i < arr.length; i++) {
    const codeElement = document.querySelector(baseID + i);
    codeElement.textContent = prefix + arr[i];
  }
}

/* Bu fonksiyon, belirtilen ID'ye sahip HTML elementine verilen val değerini yerleştirir. 
Bu, tekil bir elementin (örneğin, program sayacı, pc, hi veya lo register'ları) güncellenmesini sağlar. */
function updateElement(val, ID) {
  const codeElement = document.querySelector(ID);
  codeElement.textContent = val;
}

/* Bu sayfa, web üzerinde MIPS işlemcisine dayalı bir simülasyon çalıştırmayı amaçlayan bir arayüzü kontrol eder. 
Kullanıcı, assembly kodu girip çalıştırarak işlemcinin register'larını, veri ve komut hafızalarını gözlemleyebilir. 
Kod, özellikle compiler.js ve MIPS.js dosyalarıyla entegre çalışır, assembly kodunu makine koduna çevirir ve 
işlemcinin durumunu görsel olarak sunar.  */