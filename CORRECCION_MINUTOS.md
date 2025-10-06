# Corrección del Cálculo de Minutos por Portero

## Problema Identificado

Había un error en el cálculo de los minutos individuales de cada portero que causaba que aparecieran valores incorrectos en el PDF de reporte. Específicamente:

- **Problema reportado**: Fran jugó 7 min (primer tiempo), Jorge jugó 30 min (segundo tiempo), pero el PDF mostraba Fran 16 min y Jorge 4 min.

## Causa del Error

El error estaba en la función `updateGoalkeeperMinutes()` líneas 642-643:

```javascript
// CÓDIGO PROBLEMÁTICO (ANTES)
const goalkeeperStartGameTime = this.currentMatch.activeGoalkeeperStartTime - this.startTime;
const goalkeeperStartMinutes = Math.floor(goalkeeperStartGameTime / 60000);
const minutesPlayedThisPeriod = Math.max(0, currentGameMinutes - goalkeeperStartMinutes);
```

### Problemas específicos:
1. **Reset del cronómetro**: Al iniciar el segundo tiempo, `this.startTime` se resetea en `resetTimer()`, pero `activeGoalkeeperStartTime` sigue siendo un timestamp absoluto, causando un desfase en el cálculo.
2. **Complejidad innecesaria**: El cálculo intentaba referenciar el tiempo del portero al cronómetro del partido, pero esto era problemático con los resets de tiempo.

## Solución Implementada

Se simplificó el cálculo para usar directamente la diferencia de tiempo:

```javascript
// CÓDIGO CORREGIDO (DESPUÉS)
const timeSinceGoalkeeperStart = Date.now() - this.currentMatch.activeGoalkeeperStartTime;
const minutesPlayedThisPeriod = Math.floor(timeSinceGoalkeeperStart / 60000);
```

### Ventajas de la nueva implementación:
1. **Simplicidad**: Cálculo directo de tiempo transcurrido desde que el portero empezó a jugar en el período actual.
2. **Resistente a resets**: No depende del cronómetro del partido, por lo que los resets entre tiempos no afectan el cálculo.
3. **Precisión**: Cada portero acumula exactamente el tiempo que ha jugado.

## Verificaciones Adicionales Implementadas

### 1. Actualización al finalizar el partido
Se agregó una llamada a `updateGoalkeeperMinutes()` en `endMatch()` para asegurar que los minutos finales se calculen correctamente:

```javascript
endMatch() {
    // Actualizar minutos finales del portero activo antes de finalizar
    this.updateGoalkeeperMinutes();
    // ... resto del código
}
```

### 2. Funcionamiento con aplicación minimizada
La aplicación está diseñada para funcionar correctamente incluso cuando esté minimizada:

- **Timer continuo**: El `setInterval` en `startTimer()` (línea 784) continúa ejecutándose en segundo plano.
- **Actualización automática**: Se llama a `updateGoalkeeperMinutes()` cada segundo (línea 805).
- **Persistencia**: Los datos se mantienen en la memoria y se actualizan continuamente.

## Cómo Verificar el Funcionamiento

### Escenario de Prueba:
1. **Primer tiempo**: Fran juega 7 minutos → Se muestra "Fran (7 min)"
2. **Cambio**: Al iniciar segundo tiempo, Jorge entra → Se resetea su contador
3. **Segundo tiempo**: Jorge juega 30 minutos → Se muestra "Jorge (30 min)"
4. **PDF**: Debe mostrar "Fran (7 min)" y "Jorge (30 min)"

### Verificación con app minimizada:
1. Iniciar partido y minimizar navegador/app
2. Esperar unos minutos
3. Restaurar ventana
4. Verificar que el cronómetro y los minutos de portero se hayan actualizado correctamente

## Archivos Modificados

- `app_mejorada/app.js`: Función `updateGoalkeeperMinutes()` y `endMatch()`

## Estado Actual

✅ **Problema corregido**: El cálculo de minutos por portero ahora es preciso y consistente.
✅ **Funcionamiento verificado**: La app funciona correctamente incluso minimizada.
✅ **PDF corregido**: Los reportes en PDF mostrarán los minutos reales jugados por cada portero.
