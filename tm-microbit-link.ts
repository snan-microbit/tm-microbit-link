/**
 * Extensión para vincular Teachable Machine con micro:bit
 */
//% weight=50 color=#2ecc71 icon="\uf0e8" block="TM-micro:bit-Link"
namespace iaMachine {
    let ultimaClase = "ninguna";
    const IA_EVENT_ID = 9100; // ID único para los eventos de esta extensión

    // Función sencilla para convertir texto a número (Hash)
    function generarId(texto: string): number {
        let hash = 0;
        for (let i = 0; i < texto.length; i++) {
            hash = Math.imul(31, hash) + texto.charCodeAt(i) | 0;
        }
        return Math.abs(hash);
    }

    // Esta línea inicia el servicio automáticamente al cargar la extensión
    bluetooth.startUartService();
  
    // Procesador de datos en segundo plano
    bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        let datos = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine));
        datos = datos.trim();

        if (datos.length > 0 && datos !== ultimaClase) {
            ultimaClase = datos;
            // Disparamos un evento global. El valor es un hash del string para identificarlo.
            control.raiseEvent(IA_EVENT_ID, generarId(ultimaClase));
        }
    });

    /**
     * Se ejecuta cuando la IA detecta una clase específica.
     * @param clase Nombre de la clase configurada en Teachable Machine, eg: "clase1"
     */
    //% blockId=ia_on_class block="al detectar clase %clase"
    //% weight=100
    export function alDetectarClase(clase: string, handler: () => void) {
        // Registramos un manejador de eventos que solo se activa 
        // cuando el hash de la clase coincide.
        control.onEvent(IA_EVENT_ID, generarId(clase), handler);
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
     * Compara si la clase detectada es igual a una cadena.
     */
    //% blockId=ia_is_class block="¿la clase es %clase?"
    //% weight=80
    export function esClase(clase: string): boolean {
        return ultimaClase === clase;
    }
}