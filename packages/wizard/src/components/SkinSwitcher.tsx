"use client";
import { useState, useEffect } from "react";

const SKINS = [
  { id: "luminous", label: "Luminous Dark" },
  { id: "eink", label: "E-Ink" },
  { id: "paper", label: "Warm Paper" },
  { id: "wireframe", label: "Wireframe" },
  { id: "blueprint-blue", label: "Blueprint Blue" },
  { id: "blueprint-green", label: "Blueprint Green" },
  { id: "petal-glass", label: "Petal Glass" },
  { id: "ember-violet", label: "Ember & Violet" },
];

const SKIN_STORAGE_KEY = "atlas-fractal-skin";

export default function SkinSwitcher() {
  const [currentSkin, setCurrentSkin] = useState("luminous");

  useEffect(() => {
    const saved = localStorage.getItem(SKIN_STORAGE_KEY);
    if (saved) {
      setCurrentSkin(saved);
      document.documentElement.setAttribute("data-skin", saved);
    }
  }, []);

  const handleChange = (skinId: string) => {
    setCurrentSkin(skinId);
    document.documentElement.setAttribute("data-skin", skinId);
    localStorage.setItem(SKIN_STORAGE_KEY, skinId);
  };

  return (
    <div className="m-skin-switcher">
      <div className="m-skin-switcher__label">Theme</div>
      <div className="m-skin-switcher__options">
        {SKINS.map((skin) => (
          <button
            key={skin.id}
            className={`m-skin-switcher__option ${currentSkin === skin.id ? "m-skin-switcher__option--active" : ""}`}
            onClick={() => handleChange(skin.id)}
            title={skin.label}
          >
            {skin.label}
          </button>
        ))}
      </div>
    </div>
  );
}
