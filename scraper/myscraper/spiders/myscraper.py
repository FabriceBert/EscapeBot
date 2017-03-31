# -*- coding: utf-8 -*-

from scrapy import Spider, Request
from ..items import EscapeItem
from scrapy.selector import HtmlXPathSelector

path_url = u'https://toulouse.escapeshaker.com/'

class MyScraper(Spider):
    name = u'myscraper'


    def start_requests(self):
        # On vide le fichier avant d'inserer de nouvelles lignes
        open('escapes.json', 'w').close()
        # Connexion au site
        yield Request(
            url=path_url + 'fr/results-list.php?lat=48.85661400000001&lng=2.3522219000000177&address=Paris,France',
            callback=self.parse,
        )

    def parse(self, response):
        escapes_el = response.xpath('/html/body/main/div[4]/div[2]/ul')
        # Parcours de la liste d'escape
        for escape_el in escapes_el:
            for x in escape_el.xpath('.//li'):
                # Create a new escape item
                item = EscapeItem()
                # Recuperation de l'url de chaque page d'escape
                # On supprime le 'window.open(' .* ') de l'url pour l'utiliser
                item['urlEscape'] = x.xpath('@onclick').extract_first()
                item['urlEscape'] = path_url + item['urlEscape'][13:len(item['urlEscape'])-2]

                item['name'] = x.xpath('.//div[2]/div[1]/div[1]/text()').extract_first()
                item['room'] = x.xpath('.//div[2]/h2/text()').extract_first()
                item['price'] = x.xpath('.//div[2]/div[2]/div[2]/div/div[1]/text()').extract_first()

                # On se dirige vers la page de l'escape courant
                yield Request(
                    url=item['urlEscape'],
                    callback=self.parse_escape,
                    meta={'escape_item': item},
                )



    def parse_escape(self, response):
        # Recuperation de l'objet item contenu le meta
        item = response.meta.get('escape_item')
        escape_el = response.xpath('//*[@id="body"]/main/div[4]/div[1]/div[3]')
        # On cherche le bon chemin pour obtenir les informations generales
        # Il y a 4 chemins possibles
        if not escape_el.xpath('./h3/text()').extract_first():
            escape_el = response.xpath('//*[@id="body"]/main/div[4]/div[1]/div[2]')

            if not escape_el.xpath('./h3/text()').extract_first():
                escape_el = response.xpath('//*[@id="body"]/main/div[3]/div[1]/div[2]')

                if not escape_el.xpath('./h3/text()').extract_first():
                    escape_el = response.xpath('//*[@id="body"]/main/div[3]/div[1]/div[3]')
        # Recuperation des informations generales de l'escape
        item['category'] = escape_el.xpath('./div/span/text()').extract_first()
        item['capacity'] = escape_el.xpath('.//ul[1]/li[2]/span/text()').extract_first()
        item['level'] = escape_el.xpath('.//ul[1]/li[3]/span/text()').extract_first()
        item['language'] = escape_el.xpath('.//ul[2]/li[1]/span/text()').extract_first()
        item['nbRoom'] = escape_el.xpath('.//ul[2]/li[2]/span/text()').extract_first()
        item['disabled'] = escape_el.xpath('.//ul[2]/li[3]/span/text()').extract_first()

        item['availabilities'] = []
        listeHour = []
        jour = ''
        # On boucle sur les div de chaque semaine
        disponibilites_semaine = response.css('.showmore');
        for disponibilite_semaine in disponibilites_semaine:
            # On boucle sur chaque div contenant un creneau
            for disponibilite_creneau in disponibilite_semaine.xpath('./div/div'):
                data = disponibilite_creneau.xpath('.//text()').extract_first().replace('  ', ' ').replace('\n', '').replace('\r', '').strip()
                # On test si la div commence
                # par un chiffre => Type Hour
                # par Plus => Plus de disponibilite
                # Sinon c'est un jour
                if data[0].isdigit() or data.startswith('Plus'):
                    listeHour.append(data)
                else:
                    if jour:
                        dispo = {
                            'dayName': jour,
                            'hours': listeHour
                        }
                        item['availabilities'].append(dispo)
                    jour = data
                    listeHour = []


        yield item