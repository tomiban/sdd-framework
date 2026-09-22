# Constitution — sdd

1. **Stack mínimo.** Node + TypeScript + Vitest. Sin dependencias de runtime nuevas sin un PR que la
   justifique. Verificable: `build` y `test` verdes siempre.
2. **Spec antes de código.** Toda funcionalidad arranca en una spec en `specs/NNN-<nombre>/`; la spec
   es la fuente de verdad y el código la referencia (spec + RF). Verificable: cada entrega cita
   spec + RF.
3. **Templates centralizados.** El CLI no genera archivos a partir de strings desperdigados en el
   código: todo contenido a copiar vive en `templates/` (o `src/templates/`) y se copia a través de
   un manifiesto explícito. Verificable: sin literales de contenido fuera de `templates/`.
4. **Lógica pura testeada.** La lógica (fs, formatos, detección de estados) vive en funciones puras
   con tests Vitest; los comandos quedan como capas delgadas. Verificable: toda función de
   `src/lib/` tiene test unitario.
5. **Idempotencia.** Los comandos de inicialización se pueden ejecutar repetidas veces sin efecto
   destructivo ni errores. Verificable: `sdd init` dos veces seguidas termina con código 0.
6. **Castellano en humano, inglés en código.** Mensajes del CLI y docs en castellano; identificadores
   en inglés. Verificable: textos de CLI/docs solo en castellano, símbolos solo en inglés.