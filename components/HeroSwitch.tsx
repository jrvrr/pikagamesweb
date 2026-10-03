"use client";

import { motion } from "framer-motion";
import styles from "./HeroSwitch.module.css";

const directions = ["Arriba", "Izquierda", "Derecha", "Abajo"];
const letters = ["X", "Y", "A", "B"];

function Joystick({ side }: { side: "left" | "right" }) {
  return (
    <div className={`${styles.stickSocket} ${side === "left" ? styles.leftStick : styles.rightStick}`}>
      <motion.div
        className={styles.stickAssembly}
        drag
        dragConstraints={{ top: -8, right: 8, bottom: 8, left: -8 }}
        dragElastic={0.08}
        dragMomentum={false}
        dragSnapToOrigin
        whileDrag={{ rotate: 8 }}
      >
        <div className={styles.stickBase}>
          <button
            type="button"
            className={styles.stick}
            aria-label={`Joystick ${side === "left" ? "izquierdo" : "derecho"}; arrástralo dentro de su base`}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function HeroSwitch() {
  return (
    <div className={styles.console} role="group" aria-label="Nintendo Switch con Joy-Cons verde y fucsia">
      <div className={`${styles.joycon} ${styles.left}`}>
        <button type="button" className={`${styles.smallButton} ${styles.minus}`} aria-label="Botón menos" />
        <Joystick side="left" />
        <div className={styles.dpad} role="group" aria-label="Cruceta">
          {directions.map((direction, index) => (
            <button key={direction} type="button" className={`${styles.direction} ${styles[`direction${index}`]}`} aria-label={direction}>
              <span aria-hidden="true">▲</span>
            </button>
          ))}
        </div>
        <button type="button" className={`${styles.utility} ${styles.capture}`} aria-label="Capturar pantalla"><span /></button>
      </div>

      <div className={styles.body} aria-hidden="true">
        <div className={styles.screenFrame}>
          <div className={styles.screen} />
        </div>
        <span className={styles.vent} />
      </div>

      <div className={`${styles.joycon} ${styles.right}`}>
        <button type="button" className={`${styles.smallButton} ${styles.plus}`} aria-label="Botón más" />
        <div className={styles.faceButtons} role="group" aria-label="Botones de acción">
          {letters.map((letter) => (
            <button key={letter} type="button" className={`${styles.face} ${styles[`face${letter}`]}`} aria-label={`Botón ${letter}`}>
              {letter}
            </button>
          ))}
        </div>
        <Joystick side="right" />
        <button type="button" className={`${styles.utility} ${styles.home}`} aria-label="Botón inicio"><span /></button>
      </div>
    </div>
  );
}
