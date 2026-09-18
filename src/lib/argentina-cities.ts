export const ARGENTINA_LOCATIONS: Record<string, string[]> = {
  "Buenos Aires": [
    "La Plata", "Mar del Plata", "Bahía Blanca", "Tandil", "San Nicolás", "Zárate", "Campana", "Pergamino", "Junín", "Olavarría", "Azul", "Necochea", "Tres Arroyos", "Pehuajó", "Trenque Lauquen", "Chivilcoy", "Mercedes", "Luján", "Pilar", "Escobar", "Tigre", "San Isidro", "Vicente López", "Avellaneda", "Quilmes", "Lanús", "Lomas de Zamora", "La Matanza", "Morón", "San Martín", "Tres de Febrero", "San Miguel", "Moreno", "Merlo", "Ezeiza", "Cañuelas", "San Vicente", "La Costa"
  ],
  "Ciudad Autónoma de Buenos Aires": [
    "CABA"
  ],
  "Catamarca": [
    "San Fernando del Valle de Catamarca", "Valle Viejo", "Andalgalá", "Tinogasta", "Belén", "Santa María"
  ],
  "Chaco": [
    "Resistencia", "Presidencia Roque Sáenz Peña", "Villa Ángela", "Charata", "Castelli", "General San Martín"
  ],
  "Chubut": [
    "Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel", "Rawson", "Sarmiento", "Rada Tilly"
  ],
  "Córdoba": [
    "Córdoba", "Río Cuarto", "Villa María", "Villa Carlos Paz", "San Francisco", "Alta Gracia", "Río Tercero", "Bell Ville", "Jesús María", "Cruz del Eje", "Villa Dolores", "Cosquín", "La Falda", "Mina Clavero", "Marcos Juárez", "Arroyito"
  ],
  "Corrientes": [
    "Corrientes", "Goya", "Paso de los Libres", "Curuzú Cuatiá", "Mercedes", "Bella Vista", "Monte Caseros", "Santo Tomé"
  ],
  "Entre Ríos": [
    "Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Gualeguay", "Villaguay", "Chajarí", "Victoria", "La Paz"
  ],
  "Formosa": [
    "Formosa", "Clorinda", "Pirané", "El Colorado", "Las Lomitas"
  ],
  "Jujuy": [
    "San Salvador de Jujuy", "San Pedro", "Perico", "Libertador Gral. San Martín", "Palpalá", "La Quiaca", "Humahuaca"
  ],
  "La Pampa": [
    "Santa Rosa", "General Pico", "General Acha", "Eduardo Castex", "Toay", "Realicó"
  ],
  "La Rioja": [
    "La Rioja", "Chilecito", "Aimogasta", "Chamical", "Chepes"
  ],
  "Mendoza": [
    "Mendoza", "San Rafael", "Godoy Cruz", "Guaymallén", "Las Heras", "Maipú", "Luján de Cuyo", "San Martín", "Tunuyán", "General Alvear", "Malargüe", "Rivadavia"
  ],
  "Misiones": [
    "Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "San Vicente", "Apóstoles", "Leandro N. Alem"
  ],
  "Neuquén": [
    "Neuquén", "Cutral Có", "Zapala", "Centenario", "Plottier", "San Martín de los Andes", "Villa La Angostura", "Rincón de los Sauces", "Chos Malal"
  ],
  "Río Negro": [
    "San Carlos de Bariloche", "General Roca", "Cipolletti", "Viedma", "Villa Regina", "Cinco Saltos", "Allen", "San Antonio Oeste", "El Bolsón"
  ],
  "Salta": [
    "Salta", "San Ramón de la Nueva Orán", "Tartagal", "Rosario de la Frontera", "General Güemes", "Metán", "Cafayate", "Cerrillos"
  ],
  "San Juan": [
    "San Juan", "Rawson", "Rivadavia", "Chimbas", "Santa Lucía", "Pocito", "Caucete", "Jáchal"
  ],
  "San Luis": [
    "San Luis", "Villa Mercedes", "Merlo", "Juana Koslay", "La Punta"
  ],
  "Santa Cruz": [
    "Río Gallegos", "Caleta Olivia", "Pico Truncado", "Las Heras", "Puerto Deseado", "El Calafate", "Puerto San Julián"
  ],
  "Santa Fe": [
    "Rosario", "Santa Fe", "Rafaela", "Villa Gobernador Gálvez", "Venado Tuerto", "Reconquista", "Santo Tomé", "San Lorenzo", "Esperanza", "Granadero Baigorria", "Casilda", "Cañada de Gómez", "Rufino", "Sunchales", "Firmat", "Coronda", "San Jorge"
  ],
  "Santiago del Estero": [
    "Santiago del Estero", "La Banda", "Termas de Río Hondo", "Frías", "Añatuya", "Fernández"
  ],
  "Tierra del Fuego": [
    "Ushuaia", "Río Grande", "Tolhuin"
  ],
  "Tucumán": [
    "San Miguel de Tucumán", "Banda del Río Salí", "Yerba Buena", "Tafí Viejo", "Concepción", "Aguilares", "Famaillá", "Lules", "Monteros", "Tafí del Valle"
  ]
};

export const PROVINCES = Object.keys(ARGENTINA_LOCATIONS).sort((a, b) => a.localeCompare(b));
