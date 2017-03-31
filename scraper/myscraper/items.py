# -*- coding: utf-8 -*-

from scrapy import Item, Field


class EscapeItem(Item):

	urlEscape = Field()
	name = Field()
	room = Field()
	level = Field()
	price = Field()
	capacity = Field()
	language = Field()
	nbRoom = Field()
	disabled = Field()
	category = Field()
	availabilities = Field()
