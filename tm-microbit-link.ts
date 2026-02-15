/**
 * Extensión para vincular Teachable Machine con micro:bit
 */
//% weight=50 color=#2ecc71 icon="\uf0e8" block="TM-micro:bit-Link"
namespace iaMachine {
    let ultimaClase = "ninguna";
    let certezaActual = 0;
    const IA_EVENT_ID = 9100;
    let procesandoEvento = false;
    let autoConfirmar = false;  // Nuevo: para modo controlado

    bluetooth.startUartService();

    function generarId(texto: string): number {
        let hash = 0;
        for (let i = 0; i < texto.length; i++) {
            hash = Math.imul(31, hash) + texto.charCodeAt(i) | 0;
        }
        return Math.abs(hash);
    }
  
    // PROCESADOR DE DATOS
    bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        let datos = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine));
        datos = datos.trim();

        if (datos.length > 0) {
            let partes = datos.split("#");
            if (partes.length === 2) {
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
            if (procesandoEvento) return;
    
            if (certezaActual >= umbral && ultimaClase === clase) {
                procesandoEvento = true;
                handler();
                procesandoEvento = false;
                
                // Auto-confirmar si está habilitado (para modo controlado)
                if (autoConfirmar) {
                    bluetooth.uartWriteString("OK\n");
                }
            }
        });
    }

    /**
    * Se ejecuta cuando se detecta cualquier clase que supere el umbral.
    */
    //% blockId=ia_on_any_class 
    //% block="Al detectar cualquier clase con certeza > %umbral"
    //% umbral.min=0 umbral.max=100 umbral.defl=80
    //% weight=95
    export function alDetectarCualquierClase(umbral: number, handler: () => void) {
        control.onEvent(IA_EVENT_ID, 0, function () {
            if (procesandoEvento) return;

            if (certezaActual >= umbral) {
                procesandoEvento = true;
                handler();
                procesandoEvento = false;
                
                // Auto-confirmar si está habilitado
                if (autoConfirmar) {
                    bluetooth.uartWriteString("OK\n");
                }
            }
        });
    }

    /**
     * Devuelve el nombre de la última clase recibida.
     */
    //% blockId=ia_get_class 
    //% block="clase detectada"
    //% weight=90
    export function claseDetectada(): string {
        return ultimaClase;
    }

    /**
     * Devuelve la certeza de la última detección (0-100).
     */
    //% blockId=ia_get_certainty 
    //% block="certeza detectada"
    //% weight=85
    export function certezaDetectada(): number {
        return certezaActual;
    }

    /**
     * Habilitar modo controlado (envía confirmación automática a la app)
     */
    //% blockId=ia_enable_flow_control
    //% block="Habilitar modo controlado"
    //% weight=80
    //% advanced=true
    export function habilitarModoControlado() {
        autoConfirmar = true;
    }

    /**
     * Deshabilitar modo controlado
     */
    //% blockId=ia_disable_flow_control
    //% block="Deshabilitar modo controlado"
    //% weight=79
    //% advanced=true
    export function deshabilitarModoControlado() {
        autoConfirmar = false;
    }

    /**
     * Enviar confirmación manual a la app (solo para modo controlado)
     */
    //% blockId=ia_send_ready
    //% block="Enviar señal de listo"
    //% weight=78
    //% advanced=true
    export function enviarListo() {
        bluetooth.uartWriteString("OK\n");
    }

    // --- Bloques de Conexión ---
    /**
     * Se ejecuta cuando se conecta a la app
     */
    //% blockId=ia_on_connected 
    //% block="Al conectar a la app"
    //% weight=70
    export function alConectar(handler: () => void) {
        bluetooth.onBluetoothConnected(handler);
    }

    /**
     * Se ejecuta cuando se desconecta de la app
     */
    //% blockId=ia_on_disconnected 
    //% block="Al desconectar de la app"
    //% weight=69
    export function alDesconectar(handler: () => void) {
        bluetooth.onBluetoothDisconnected(handler);
    }
}
