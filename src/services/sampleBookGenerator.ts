import { Book } from '../types';

export function createSamplePdfBlob(): Blob {
  // Generates a valid multi-page PDF document in PDF 1.4 format
  const pagesContent = [
    // Page 1: Book Cover
    [
      'BT /F2 30 Tf 72 650 Td (THE ART OF NATURAL PHILOSOPHY) Tj ET',
      'BT /F1 14 Tf 72 610 Td (A Field Guide to the Physical Cosmos & Living Systems) Tj ET',
      'BT /F1 12 Tf 72 570 Td (By Dr. Elena Vance - Natural Sciences Institute) Tj ET',
      '0.2 0.4 0.6 rg 72 540 468 2 re f 0 g',
      'BT /F1 11 Tf 72 490 Td (Welcome to the Interactive PDF Book Reader.) Tj ET',
      'BT /F1 11 Tf 72 470 Td (This digital book is crafted to replicate the tactile joy of reading) Tj ET',
      'BT /F1 11 Tf 72 450 Td (a real physical volume. You can turn pages by clicking or touching) Tj ET',
      'BT /F1 11 Tf 72 430 Td (the edges and dragging across the spine.) Tj ET',
      'BT /F1 10 Tf 72 150 Td (First Edition - Published for Mindful Digital Reading) Tj ET',
      'BT /F1 9 Tf 72 130 Td (Drag the right page leftwards to begin reading Chapter I.) Tj ET',
    ],
    // Page 2: Table of Contents & Preface
    [
      'BT /F2 20 Tf 72 700 Td (Contents & Preface) Tj ET',
      '0.3 0.3 0.3 rg 72 680 468 1 re f 0 g',
      'BT /F2 13 Tf 72 630 Td (Chapter I: The Architecture of Light) Tj ET',
      'BT /F1 11 Tf 380 630 Td (Page 3) Tj ET',
      'BT /F2 13 Tf 72 590 Td (Chapter II: Motion, Gravitation, and Orbits) Tj ET',
      'BT /F1 11 Tf 380 590 Td (Page 4) Tj ET',
      'BT /F2 13 Tf 72 550 Td (Chapter III: The Fluidity of Atmosphere) Tj ET',
      'BT /F1 11 Tf 380 550 Td (Page 5) Tj ET',
      'BT /F2 13 Tf 72 510 Td (Chapter IV: Thermodynamics and Equilibrium) Tj ET',
      'BT /F1 11 Tf 380 510 Td (Page 6) Tj ET',
      'BT /F2 13 Tf 72 470 Td (Chapter V: Soundscapes and Acoustic Waves) Tj ET',
      'BT /F1 11 Tf 380 470 Td (Page 7) Tj ET',
      'BT /F2 13 Tf 72 430 Td (Epilogue: The Inquisitive Observer) Tj ET',
      'BT /F1 11 Tf 380 430 Td (Page 8) Tj ET',
      'BT /F1 11 Tf 72 360 Td (Preface: To hold a book is to hold a conversation preserved in time.) Tj ET',
      'BT /F1 11 Tf 72 340 Td (Notice how the paper responds to your gesture. Select any sentence) Tj ET',
      'BT /F1 11 Tf 72 320 Td (with your cursor or finger to add color highlights, bookmarks,) Tj ET',
      'BT /F1 11 Tf 72 300 Td (or consult the scholarly AI companion for deep explanations.) Tj ET',
    ],
    // Page 3: Chapter I
    [
      'BT /F2 22 Tf 72 700 Td (Chapter I: The Architecture of Light) Tj ET',
      '0.85 0.65 0.1 rg 72 682 468 1.5 re f 0 g',
      'BT /F1 11 Tf 72 640 Td (Light is both a messenger and a sculptor of our world. When sunlight) Tj ET',
      'BT /F1 11 Tf 72 620 Td (traverses the vacuum of space, it carries the thermal signature) Tj ET',
      'BT /F1 11 Tf 72 600 Td (of thermonuclear fusion occurring inside the core of our sun.) Tj ET',
      'BT /F1 11 Tf 72 560 Td (Upon striking planetary atmosphere, photons encounter diatomic) Tj ET',
      'BT /F1 11 Tf 72 540 Td (nitrogen and oxygen molecules. Rayleigh scattering preferentially) Tj ET',
      'BT /F1 11 Tf 72 520 Td (disperses the shorter, blue wavelengths in all directions across) Tj ET',
      'BT /F1 11 Tf 72 500 Td (the celestial vault, painting our midday sky in cerulean hues.) Tj ET',
      'BT /F2 13 Tf 72 440 Td (1.1 The Duality of Wave and Particle) Tj ET',
      'BT /F1 11 Tf 72 410 Td (Christiaan Huygens proposed that light traveled as undulating waves,) Tj ET',
      'BT /F1 11 Tf 72 390 Td (rippling through an invisible ether. Isaac Newton, conversely,) Tj ET',
      'BT /F1 11 Tf 72 370 Td (advocated for corpuscular rays of distinct discrete packets.) Tj ET',
      'BT /F1 11 Tf 72 330 Td (Two centuries later, Max Planck and Albert Einstein reconciled both) Tj ET',
      'BT /F1 11 Tf 72 310 Td (perspectives through quantum electrodynamics: light exhibits both) Tj ET',
      'BT /F1 11 Tf 72 290 Td (interference patterns and photoelectric particle interactions.) Tj ET',
      'BT /F1 10 Tf 270 80 Td (- 3 -) Tj ET',
    ],
    // Page 4: Chapter II
    [
      'BT /F2 22 Tf 72 700 Td (Chapter II: Gravitation & Celestial Orbits) Tj ET',
      '0.2 0.5 0.7 rg 72 682 468 1.5 re f 0 g',
      'BT /F1 11 Tf 72 640 Td (Gravitation is the grand choreographer of astronomical bodies.) Tj ET',
      'BT /F1 11 Tf 72 620 Td (Johannes Kepler painstakingly examined Tycho Brahes observational) Tj ET',
      'BT /F1 11 Tf 72 600 Td (data of Mars to formulate three fundamental laws of planetary motion:) Tj ET',
      'BT /F2 11 Tf 90 560 Td (1. Planets orbit along ellipses with the sun at one focus.) Tj ET',
      'BT /F2 11 Tf 90 535 Td (2. An imaginary radius vector sweeps out equal areas in equal times.) Tj ET',
      'BT /F2 11 Tf 90 510 Td (3. The square of the orbital period scales with the cube of the distance.) Tj ET',
      'BT /F1 11 Tf 72 460 Td (Sir Isaac Newton showed that a single inverse-square force accounts) Tj ET',
      'BT /F1 11 Tf 72 440 Td (for both the falling apple on an English orchard and the perpetual) Tj ET',
      'BT /F1 11 Tf 72 420 Td (embrace between the Moon and the Earth.) Tj ET',
      'BT /F1 11 Tf 72 370 Td (In 1915, Albert Einstein provided a revolutionary geometric insight:) Tj ET',
      'BT /F1 11 Tf 72 350 Td (gravity is not a mysterious tug through empty void, but the curvature) Tj ET',
      'BT /F1 11 Tf 72 330 Td (of spacetime itself deformed by mass and energy.) Tj ET',
      'BT /F1 10 Tf 270 80 Td (- 4 -) Tj ET',
    ],
    // Page 5: Chapter III
    [
      'BT /F2 22 Tf 72 700 Td (Chapter III: The Fluidity of Atmosphere) Tj ET',
      '0.3 0.6 0.4 rg 72 682 468 1.5 re f 0 g',
      'BT /F1 11 Tf 72 640 Td (We live immersed at the floor of a vast ocean of gas. The atmosphere) Tj ET',
      'BT /F1 11 Tf 72 620 Td (exerts approximately 101.3 kilopascals of pressure at sea level,) Tj ET',
      'BT /F1 11 Tf 72 600 Td (the equivalent of one kilogram pressing upon every square centimeter.) Tj ET',
      'BT /F2 13 Tf 72 550 Td (3.1 Pressure Gradients and Wind Patterns) Tj ET',
      'BT /F1 11 Tf 72 520 Td (Winds are born from uneven solar heating of the Earths surface.) Tj ET',
      'BT /F1 11 Tf 72 500 Td (Warm equatorial air ascends into the upper troposphere, creating) Tj ET',
      'BT /F1 11 Tf 72 480 Td (regions of low pressure, while cooler polar air descends.) Tj ET',
      'BT /F1 11 Tf 72 440 Td (Due to the Earths eastward rotation, the Coriolis deflection) Tj ET',
      'BT /F1 11 Tf 72 420 Td (curves moving air masses clockwise in the Northern Hemisphere) Tj ET',
      'BT /F1 11 Tf 72 400 Td (and counterclockwise in the Southern Hemisphere, orchestrating) Tj ET',
      'BT /F1 11 Tf 72 380 Td (trade winds and cyclonic storm systems.) Tj ET',
      'BT /F1 10 Tf 270 80 Td (- 5 -) Tj ET',
    ],
    // Page 6: Chapter IV
    [
      'BT /F2 22 Tf 72 700 Td (Chapter IV: Thermodynamics & Entropy) Tj ET',
      '0.7 0.3 0.3 rg 72 682 468 1.5 re f 0 g',
      'BT /F1 11 Tf 72 640 Td (Thermodynamics governs every transformation of energy in nature.) Tj ET',
      'BT /F1 11 Tf 72 620 Td (The First Law dictates conservation: energy cannot be created) Tj ET',
      'BT /F1 11 Tf 72 600 Td (or destroyed, merely converted from chemical to kinetic or thermal.) Tj ET',
      'BT /F2 13 Tf 72 540 Td (4.1 The Arrow of Time) Tj ET',
      'BT /F1 11 Tf 72 510 Td (The Second Law introduces entropy, a measure of molecular) Tj ET',
      'BT /F1 11 Tf 72 490 Td (disorder and multiplicity of states. In any isolated system,) Tj ET',
      'BT /F1 11 Tf 72 470 Td (entropy spontaneously increases over time, establishing an irreversible) Tj ET',
      'BT /F1 11 Tf 72 450 Td (cosmological arrow of time that differentiates past from future.) Tj ET',
      'BT /F1 11 Tf 72 400 Td (Yet within localized open systems, such as biological organisms,) Tj ET',
      'BT /F1 11 Tf 72 380 Td (intricate order and complexity can flourish by expelling heat) Tj ET',
      'BT /F1 11 Tf 72 360 Td (and consuming external solar nourishment.) Tj ET',
      'BT /F1 10 Tf 270 80 Td (- 6 -) Tj ET',
    ],
    // Page 7: Chapter V
    [
      'BT /F2 22 Tf 72 700 Td (Chapter V: Soundscapes & Acoustic Waves) Tj ET',
      '0.5 0.3 0.6 rg 72 682 468 1.5 re f 0 g',
      'BT /F1 11 Tf 72 640 Td (Sound is mechanical vibration propagating through elastic matter.) Tj ET',
      'BT /F1 11 Tf 72 620 Td (Unlike electromagnetic waves, acoustic waves require a physical) Tj ET',
      'BT /F1 11 Tf 72 600 Td (medium of molecules to compress and rarefy.) Tj ET',
      'BT /F1 11 Tf 72 550 Td (In dry air at 20 degrees Celsius, sound travels at roughly) Tj ET',
      'BT /F1 11 Tf 72 530 Td (343 meters per second. In water, where density and bulk modulus) Tj ET',
      'BT /F1 11 Tf 72 510 Td (are higher, acoustic signals surge forward at over 1,480 m/s.) Tj ET',
      'BT /F2 13 Tf 72 450 Td (5.1 Harmonic Resonance and Music) Tj ET',
      'BT /F1 11 Tf 72 420 Td (When a violin string is plucked, standing waves emerge. The fundamental) Tj ET',
      'BT /F1 11 Tf 72 400 Td (pitch is complemented by an integer series of overtones (harmonics),) Tj ET',
      'BT /F1 11 Tf 72 380 Td (giving musical instruments their distinctive timbre and emotional depth.) Tj ET',
      'BT /F1 10 Tf 270 80 Td (- 7 -) Tj ET',
    ],
    // Page 8: Epilogue
    [
      'BT /F2 22 Tf 72 700 Td (Epilogue: The Inquisitive Observer) Tj ET',
      '0.4 0.4 0.4 rg 72 682 468 1.5 re f 0 g',
      'BT /F1 11 Tf 72 640 Td (Science is not a mere repository of static facts, but a dynamic) Tj ET',
      'BT /F1 11 Tf 72 620 Td (dialogue between empirical observation and human curiosity.) Tj ET',
      'BT /F1 11 Tf 72 580 Td (You have now explored the eight sample pages of this demonstration.) Tj ET',
      'BT /F1 11 Tf 72 560 Td (Notice how seamlessly you can navigate forwards and backwards,) Tj ET',
      'BT /F1 11 Tf 72 540 Td (add yellow or green highlights, toggle two-page book mode,) Tj ET',
      'BT /F1 11 Tf 72 520 Td (and return at any time with your reading position intact.) Tj ET',
      'BT /F2 13 Tf 72 460 Td (Ready to read your own books?) Tj ET',
      'BT /F1 11 Tf 72 430 Td (Click "Library" in the top-left to upload textbooks, novels,) Tj ET',
      'BT /F1 11 Tf 72 410 Td (research papers, or sheet music in PDF format.) Tj ET',
      'BT /F1 10 Tf 270 80 Td (- 8 -) Tj ET',
    ],
  ];

  let pdfString = '%PDF-1.4\n';
  const objectOffsets: number[] = [];

  function addObject(content: string): number {
    objectOffsets.push(pdfString.length);
    const objNum = objectOffsets.length;
    pdfString += `${objNum} 0 obj\n${content}\nendobj\n`;
    return objNum;
  }

  // Object 1: Catalog
  // Object 2: Pages tree
  // Object 3: Helvetica
  // Object 4: Helvetica-Bold
  const pageCount = pagesContent.length;
  // We'll placeholder the catalog and pages tree
  const catalogObjNum = 1;
  const pagesObjNum = 2;
  const fontRegularObjNum = 3;
  const fontBoldObjNum = 4;

  const pageObjNums: number[] = [];
  const contentStreamObjNums: number[] = [];

  // First let's reserve offsets for 1..4
  // We can construct them systematically:
  // 1: Catalog
  // 2: Pages
  // 3: Font F1
  // 4: Font F2
  // Then for each page:
  //   Page obj
  //   Content obj

  const kidsList = Array.from({ length: pageCount }, (_, i) => `${5 + i * 2} 0 R`).join(' ');

  objectOffsets.push(pdfString.length);
  pdfString += `1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n`;

  objectOffsets.push(pdfString.length);
  pdfString += `2 0 obj\n<</Type /Pages /Kids [${kidsList}] /Count ${pageCount}>>\nendobj\n`;

  objectOffsets.push(pdfString.length);
  pdfString += `3 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>\nendobj\n`;

  objectOffsets.push(pdfString.length);
  pdfString += `4 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>>\nendobj\n`;

  for (let i = 0; i < pageCount; i++) {
    const pageIndex = i;
    const pageObjNum = 5 + pageIndex * 2;
    const contentObjNum = 6 + pageIndex * 2;

    const streamCommands = pagesContent[pageIndex].join('\n');
    const streamLength = new TextEncoder().encode(streamCommands).length;

    // Page object
    objectOffsets.push(pdfString.length);
    pdfString += `${pageObjNum} 0 obj\n<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 3 0 R /F2 4 0 R>>>> /Contents ${contentObjNum} 0 R>>\nendobj\n`;

    // Content stream object
    objectOffsets.push(pdfString.length);
    pdfString += `${contentObjNum} 0 obj\n<</Length ${streamLength}>>\nstream\n${streamCommands}\nendstream\nendobj\n`;
  }

  const startXref = pdfString.length;
  const totalObjects = objectOffsets.length + 1;

  pdfString += `xref\n0 ${totalObjects}\n0000000000 65535 f \n`;
  for (let offset of objectOffsets) {
    const offsetStr = String(offset).padStart(10, '0');
    pdfString += `${offsetStr} 00000 n \n`;
  }

  pdfString += `trailer\n<</Size ${totalObjects} /Root 1 0 R>>\nstartxref\n${startXref}\n%%EOF`;

  return new Blob([pdfString], { type: 'application/pdf' });
}

export function createSampleBook(): Book {
  const blob = createSamplePdfBlob();
  return {
    id: 'sample-book-nature-science',
    name: 'The Art of Natural Philosophy',
    originalFileName: 'Natural_Philosophy_Field_Guide.pdf',
    pdfBlob: blob,
    pageCount: 8,
    createdAt: Date.now() - 3600000 * 24 * 2,
    updatedAt: Date.now(),
    lastReadPage: 1,
    fileSize: blob.size,
  };
}
