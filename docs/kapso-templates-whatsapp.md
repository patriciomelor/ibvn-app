# Templates WhatsApp para Kapso

Estos son los tres templates sugeridos para registrar en Kapso/Meta. Usar idioma `Spanish (Chile)` con código `es_CL`.

> Meta revisa y asigna la categoría final. Para avisos de contenido de la iglesia, probar primero con `UTILITY`; si Meta lo clasifica como contenido promocional, usar `MARKETING`.

## 1. Bienvenida

**Nombre:** `ibvn_bienvenida`

**Categoría sugerida:** `UTILITY`

**Encabezado:** sin encabezado

**Cuerpo:**

```text
Hola {{1}}, bienvenido/a a IBVN.

Tu cuenta ya está activa. Desde la aplicación podrás acceder a devocionales, recursos y comunicados de la iglesia.

Nos alegra tenerte con nosotros.
```

**Variables del cuerpo:**

| Variable | Valor |
| --- | --- |
| `{{1}}` | Nombre visible del usuario |

**Pie de página:** `IBVN App`

## 2. Nuevo devocional

**Nombre:** `ibvn_nuevo_devocional`

**Categoría sugerida:** `UTILITY`

**Encabezado:** sin encabezado

**Cuerpo:**

```text
Hola {{1}}, ya está disponible un nuevo devocional en IBVN App.

Título: {{2}}

Léelo y registra tu reflexión personal en:
{{3}}

Que Dios bendiga tu tiempo con Su Palabra.
```

**Variables del cuerpo:**

| Variable | Valor |
| --- | --- |
| `{{1}}` | Nombre visible del usuario |
| `{{2}}` | Título del devocional |
| `{{3}}` | URL pública del devocional o de la aplicación |

**Pie de página:** `IBVN App`

## 3. Nuevo recurso

**Nombre:** `ibvn_nuevo_recurso`

**Categoría sugerida:** `UTILITY`

**Encabezado:** sin encabezado

**Cuerpo:**

```text
Hola {{1}}, hay un nuevo recurso disponible en IBVN App.

Recurso: {{2}}
Categoría: {{3}}

Puedes revisarlo aquí:
{{4}}
```

**Variables del cuerpo:**

| Variable | Valor |
| --- | --- |
| `{{1}}` | Nombre visible del usuario |
| `{{2}}` | Título del recurso |
| `{{3}}` | Categoría del recurso |
| `{{4}}` | URL pública del recurso o de la aplicación |

**Pie de página:** `IBVN App`

## Payload de prueba

Después de que Meta apruebe `ibvn_bienvenida`, probarlo desde Kapso con este payload:

```json
{
  "messaging_product": "whatsapp",
  "to": "+56968533776",
  "type": "template",
  "template": {
    "name": "ibvn_bienvenida",
    "language": { "code": "es_CL" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Patricio" }
        ]
      }
    ]
  }
}
```

## Payload desde IBVN App

El endpoint existente acepta las variables en el mismo orden del template:

```json
{
  "to": "+56968533776",
  "templateName": "ibvn_nuevo_devocional",
  "languageCode": "es_CL",
  "templateParams": [
    "Patricio",
    "Una vida de oración",
    "https://vidanueva.app/devocional"
  ]
}
```

## Recomendaciones antes de enviar a revisión

- No cambiar el nombre del template después de integrarlo en la app.
- Mantener exactamente el orden de las variables `{{1}}`, `{{2}}`, etc.
- No incluir la API key en el frontend ni en los payloads del navegador.
- Verificar que la URL usada en cada template sea pública y comience con `https://`.
- Crear primero los templates y probar el de bienvenida; después conectar los avisos de devocional y recurso con sus respectivos `templateParams`.
