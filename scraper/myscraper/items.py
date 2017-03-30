# -*- coding: utf-8 -*-

from scrapy import Item, Field


class EscapeItem(Item):

	url = Field()
	name = Field()
	room = Field()
	difficulte = Field()
	prix = Field()
	capacite = Field()
	langue = Field()
	nbSalle = Field()
	handicape = Field()
	categorie = Field()
	disponibilites = Field()
