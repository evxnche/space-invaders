// Singleton image store — import IMGS anywhere to access loaded images
export const IMGS = {};

export async function preloadImages() {
  const files = {
    head:   'head.png',
    cball:  'cball.png',
    gcball: 'gcball.png',
    fries:  'fries.png',
    mario:  'mario.png',
    o1:     'o1.png',
    o2:     'o2.png',
    o3:     'o3.png',
    o4:     'o4.png',
    arches: 'arches.png',
  };

  await Promise.all(
    Object.entries(files).map(([name, src]) =>
      new Promise(resolve => {
        const img = new Image();
        img.onload = () => { IMGS[name] = img; resolve(); };
        img.onerror = () => { console.warn(`Could not load ${src}`); resolve(); };
        img.src = src;
      })
    )
  );
}
