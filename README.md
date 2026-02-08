# Prueba Técnica – Productos Financieros

Este proyecto corresponde a la prueba técnica de frontend realizada con Angular, consumiendo un backend local en Node.js provisto por el equipo evaluador.

A continuación se resumen los dos puntos clave solicitados:  
1) Cambios aplicados en el backend  
2) Resultados de pruebas unitarias y cobertura final

## Cambio aplicado en el Backend

El backend utilizado en la prueba originalmente **no incluía ningún prefijo de ruta**, lo cual hacía que las rutas expuestas fueran:

- /products
- /products/:id
- /products/verification/:id


Sin embargo, según el enunciado oficial, **todas las rutas deben comenzar con `/bp`**, por ejemplo:



- /bp/products
- /bp/products/:id
- /bp/products/verification/:id


Para alinear completamente el backend con la documentación, se agregó la siguiente línea en la configuración del servidor Express:


routePrefix: "/bp",


Implementado dentro de:

```ts
const app = createExpressServer({
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },

  routePrefix: "/bp",

  controllers: [
    __dirname + "/controllers/*{.js,.ts}",
  ],
});
```

## Pruebas Unitarias

Las pruebas unitarias se implementaron utilizando:

- Angular TestBed

- Jasmine

- HttpClientTestingModule

- RouterTestingModule

Se cubrieron:

- Servicios (manejo de éxito y error en llamadas HTTP)

- Componentes de formulario (validaciones, errores, flujos de creación/edición)

- Listado de productos (paginación, filtros, menú contextual, eliminación)

- Casos de error y rutas alternativas (branches)

Resultados de cobertura:

Después de implementar todas las pruebas necesarias:

* Statements   : 95%   (209/220)
* Branches     : 88%   (44/50)
* Functions    : 96.36% (53/55)
* Lines        : 97.11% (202/208)
