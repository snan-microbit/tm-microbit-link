/**
 * Extensión para vincular Teachable Machine con micro:bit
 */
//% weight=50 color=#2ecc71 icon="\uf0e8" block="TM-micro:bit-Link"
namespace iaMachine {
    let ultimaClase = "ninguna";
    let certezaActual = 0;
    const IA_EVENT_ID = 9100;

    bluetooth.startUartService();

    function generarId(texto: string): number {
        let hash = 0;
        for (let i = 0; i < texto.length; i++) {
            hash = Math.imul(31, hash) + texto.charCodeAt(i) | 0;
        }
        return Math.abs(hash);
    }
  
// PROCESADOR DE DATOS: Corregido
    bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        let datos = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine));
        datos = datos.trim();

        if (datos.length > 0) {
            let partes = datos.split("#");
            if (partes.length === 2) {
                // Importante: No usamos variables globales para la validación inmediata
                let claseRecibida = partes[0];
                let certezaRecibida = parseInt(partes[1]);
                
                // Actualizamos las globales para los bloques de consulta
                ultimaClase = claseRecibida;
                certezaActual = certezaRecibida;
                
                // Lanzamos el evento general
                control.raiseEvent(IA_EVENT_ID, generarId(claseRecibida));
            }
        }
    });

    /**
     * Se ejecuta cuando se recibe una clase específica y supera el umbral.
     */
    //% blockId=ia_on_class_threshold 
    //% block="Al detectar clase %clase con certeza > %umbral"
    //% umbral.min=0 umbral.max=100 umbral.defl=80
    //% weight=100
    export function alDetectarClase(clase: string, umbral: number, handler: () => void) {
        control.onEvent(IA_EVENT_ID, generarId(clase), function() {
            // Si ya estamos procesando un handler, ignoramos los eventos nuevos
            // Esto evita que se acumulen en la memoria
            if (procesandoEvento) return; 
    
            if (certezaActual >= umbral && ultimaClase === clase) {
                procesandoEvento = true; // Bloqueamos
                handler();
                procesandoEvento = false; // Liberamos al terminar
            }
        });
    }

    /**
     * Devuelve el nombre de la última clase recibida.
     */
    //% blockId=ia_get_class block="clase detectada"
    //% weight=90
    export function claseDetectada(): string {
        return ultimaClase;
    }

    /**
     * Devuelve la certeza de la última detección (0-100).
     */
    //% blockId=ia_get_certainty block="certeza detectada"
    //% weight=85
    export function certezaDetectada(): number {
        return certezaActual;
    }

    // --- Bloques de Conexión (sin cambios) ---
    //% blockId=ia_on_conected block="Al conectar a la app"
    export function alConectar(handler: () => void) {
        bluetooth.onBluetoothConnected(handler);
    }

    //% blockId=ia_on_disconected block="Al desconectar de la app"
    export function alDesconectar(handler: () => void) {
        bluetooth.onBluetoothDisconnected(handler);
    }
}
