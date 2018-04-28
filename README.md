# Site officiel de MineWeb

## Présentation

Ce site présente le CMS et affiche les différents plugins et thèmes disponible sur le CMS. Le site est hébergé chez Github Pages et le contenu est donc uniquement statique.

## Plugins et thèmes

Si vous souhaitez que votre thème ou votre plugin soit affiché sur le CMS ainsi que sur la page du market de mineweb.org, il vous suffit de faire une pull-request sur ce repo et d'ajouter votre plugin/thème dans un de ces fichiers:
- https://github.com/MineWeb/mineweb.org/blob/gh-pages/market/plugins.json pour les plugins
- https://github.com/MineWeb/mineweb.org/blob/gh-pages/market/themes.json pour les thèmes

### Plugin et thème gratuit

Si votre plugin ou votre thème est gratuit, vous devez ajouter le repo de celui-ci sur notre [organisation Github](https://github.com/MineWeb) avec le nom approprié (Préfixé par _Plugin-_ ou _Theme-_). Si vous ne faites pas partie de l'organisation, demandez-le dans la pull-request. Il vous suffit de mettre dans le json `free` a `true`, il vous faut également préciser le repo avec la clé `repo`.

#### Les mise à jour

Le CMS autogère le téléchargement et les mise à jour des plugins et thèmes gratuit. Il se base sur la branche `master`.

### Plugin et thème payant

Si votre plugin ou votre thème est payant, c'est à vous de gérer le paiement ainsi que la partie téléchargement et mise à jour. Il vous suffit de mettre dans le json un ou plusieurs moyen de contact comme ceci:

```json
"contact": [
  {
    "type": "discord",
    "value": "NorthenFlo#6999"
  },
  {
    "type": "email",
    "value": "contact@empiregroup.eu"
  }
]
```
