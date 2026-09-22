# Constitution — <nombre del proyecto>

Principios inexorables de este proyecto: no se negocian, no se borran. Si un cambio los viola, el
cambio está mal. Cada uno define cómo se verifica.

1. **Spec antes de código.** Toda feature arranca en una spec (`specs/NNN-<slug>/`) que es la
   fuente de verdad; el código la implementa y la referencia, nunca la contradice. Verificable:
   cada cambio cita la spec y los RF que cubre.
2. **Lógica pura testeada.** La lógica del dominio vive en módulos puros con tests unitarios; la UI
   (si la hay) solo renderiza y delega. Verificable: función pura sin test → no entra.
3. **Templates centralizados.** El contenido generado (docs, scaffolds, plantillas) se copia desde
   `templates/`; nunca strings de contenido desperdigados en el código. Verificable: sin literales
   de contenido fuera de `templates/`.
4. **Idempotencia y no destructividad.** Los comandos se pueden repetir sin efectos secundarios y
   jamás sobrescriben trabajo existente. Verificable: repetir un comando devuelve el mismo
   resultado y no modifica nada.
5. **Stack mínimo.** Solo dependencias estrictamente necesarias; ninguna nueva sin justificación
   escrita. Verificable: build y tests verdes siempre.
6. **Castellano en humano, inglés en código.** Comentarios, mensajes y docs en español;
   identificadores en inglés. Verificable: textos visibles solo en español, símbolos solo en
   inglés.
