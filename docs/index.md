---
# You don't need to edit this file, it's empty on purpose.
# Edit theme's home layout instead if you wanna make some changes
# See: https://jekyllrb.com/docs/themes/#overriding-theme-defaults
layout: default
---


# Tutorials for using geocure

The provided tutorials serve as a starting and inspiration point for using [geocure](https://github.com/52North/geocure) from [52N](http://52north.org/) in the development of applications. In order to give the users a jump start,  exemplary scenarios are used to illustrate its benefits.

geocure is a proxy server, providing a REST interface for interacting with WM- and WF services.
Information in detail is provided by the [http://52north.github.io/geocure/](documentation).

A running instance of geocure can be accessed via a [http://colabis.dev.52north.org/geocure/services](http://colabis.dev.52north.org/geocure/services).
This is a test server, maintained by 52N, providing data from the [COLABIS](https://colabis.de/) project.
You can use the link to explorer the RESTful interface.

## Contents

<div class="trigger">
  {% for my_page in site.pages %}
    {% if my_page.title %}
    <div>
      <a class="page-link" href="{{ my_page.url | relative_url }}">{{ my_page.title | escape }}</a>
    </div>
    {% endif %}
  {% endfor %}
</div>
<br/>

## Acknowledgement

The development of geocure was performed as part of the  [COLABIS](http://geoserver.org/) project.
![Alt text](https://colabis.de/images/bmbf_logo_en.png "bmbf_logo")
![Alt text](https://colabis.de/images/Logo_En.png "Colabis Logo")
