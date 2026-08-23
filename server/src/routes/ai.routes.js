import {Router} from "express";

const router = Router();

router.post("/generate", async (req, res) => {

    const request = req.body.prompt;

    const BASE_PROMPT = `
        Okay tu es un chef cuisinier, je vais te demander une recette que tu dois me donner. TU NE PEUX REPONDRE QUE SOUS CE FORMAT JSON LA:
        {                                                                                                                                                                                                                                                 
    "title": "Pot-au-feu de grand-mère",                                                                                                                                                                                                            
    "description": "Un pot-au-feu traditionnel mijoté longuement avec des légumes racines et de la viande de bœuf fondante.",                                                                                                                       
    "prepTime": 40,                                                                                                                                                                                                                                 
    "cookTime": 240,                                                                                                                                                                                                                                
    "servings": 6,

    "owner": 2,                                                                                                                                                                                                                                  
    "ingredients": [                                                                                                                                                                                                                                
      { "name": "Plat de côtes de bœuf", "unit": "g", "type": "viande", "quantity": 800 },                                                                                                                                                          
      { "name": "Jarret de bœuf", "unit": "g", "type": "viande", "quantity": 600 },                                                                                                                                                                 
      { "name": "Os à moelle", "unit": "unité", "type": "viande", "quantity": 3 },                                                                                                                                                                  
      { "name": "Carottes", "unit": "unité", "type": "légume", "quantity": 6 },                                                                                                                                                                     
      { "name": "Poireaux", "unit": "unité", "type": "légume", "quantity": 3 },                                                                                                                                                                     
      { "name": "Navets", "unit": "unité", "type": "légume", "quantity": 3 },                                                                                                                                                                       
      { "name": "Pommes de terre", "unit": "unité", "type": "légume", "quantity": 6 },                                                                                                                                                              
      { "name": "Oignon", "unit": "unité", "type": "légume", "quantity": 1 },                                                                                                                                                                       
      { "name": "Clous de girofle", "unit": "unité", "type": "épice", "quantity": 2 },                                                                                                                                                              
      { "name": "Gousses d'ail", "unit": "unité", "type": "légume", "quantity": 3 },                                                                                                                                                                
      { "name": "Bouquet garni", "unit": "unité", "type": "aromate", "quantity": 1 },                                                                                                                                                               
      { "name": "Gros sel", "unit": "g", "type": "épice", "quantity": 15 },                                                                                                                                                                         
      { "name": "Poivre en grains", "unit": "g", "type": "épice", "quantity": 5 }                                                                                                                                                                   
    ],                                                                                                                                                                                                                                              
    "steps": [                                                                                                                                                                                                                                      
      { "step_number": 1, "description": "Parer la viande en retirant l'excès de gras, puis la ficeler si nécessaire pour qu'elle garde sa forme à la cuisson." },                                                                                  
      { "step_number": 2, "description": "Placer la viande et les os à moelle dans une grande marmite et couvrir largement d'eau froide." },                                                                                                        
      { "step_number": 3, "description": "Porter à ébullition à feu vif sans couvrir, en surveillant attentivement." },                                                                                                                             
      { "step_number": 4, "description": "Écumer soigneusement la mousse et les impuretés qui remontent à la surface à l'aide d'une écumoire." },                                                                                                   
      { "step_number": 5, "description": "Peler l'oignon et le piquer avec les deux clous de girofle." },                                                                                                                                           
      { "step_number": 6, "description": "Ajouter l'oignon piqué, les gousses d'ail non pelées et le bouquet garni dans la marmite." },                                                                                                             
      { "step_number": 7, "description": "Saler avec le gros sel et poivrer, puis réduire le feu pour obtenir un frémissement léger." },                                                                                                            
      { "step_number": 8, "description": "Couvrir partiellement et laisser mijoter à feu doux pendant 2 heures, en écumant de temps en temps." },                                                                                                   
      { "step_number": 9, "description": "Pendant ce temps, éplucher les carottes, les navets et les pommes de terre." },                                                                                                                           
      { "step_number": 10, "description": "Nettoyer les poireaux en profondeur sous l'eau froide pour retirer toute trace de terre, puis les couper en tronçons." },                                                                                
      { "step_number": 11, "description": "Après 2 heures de cuisson, ajouter les carottes et les navets dans la marmite." },                                                                                                                       
      { "step_number": 12, "description": "Poursuivre la cuisson à couvert pendant encore 45 minutes." },                                                                                                                                           
      { "step_number": 13, "description": "Ajouter les poireaux et les pommes de terre, puis rectifier l'assaisonnement si besoin." },                                                                                                              
      { "step_number": 14, "description": "Laisser mijoter encore 45 minutes, jusqu'à ce que tous les légumes soient parfaitement tendres." },                                                                                                      
      { "step_number": 15, "description": "Retirer le bouquet garni et l'oignon piqué avant de servir." },                                                                                                                                          
      { "step_number": 16, "description": "Découper la viande en tranches ou en morceaux généreux." },                                                                                                                                              
      { "step_number": 17, "description": "Disposer la viande et les légumes dans un grand plat de service creux." },                                                                                                                               
      { "step_number": 18, "description": "Arroser généreusement de bouillon chaud et servir immédiatement avec de la moutarde, des cornichons et du gros sel." }                                                                                   
    ]                                                                                                                                                                                                                                               
  }             
  
  Tout ce qui vient ensuite est la recette que je te demande
    `;

    const body = {
        "model": "gemma4",
        "prompt": BASE_PROMPT + request,
        "stream": false
    }

    const response = await fetch("http://192.168.10.120:11434/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
    })

    const result = await response.json();
    console.log(result);

    res.json({
        "result": result.response
    });
})

export default router;