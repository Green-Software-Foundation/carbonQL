<div id="header" align="center">
<img style=”margin: 0px” src=hack-banner.png alt=”banner” height=”500" />
</div>

----------------------------

**Welcome to [CarbonHack 24](https://grnsft.org/hack/github) from the Green Software Foundation.**

> From Monday, 18th March - Monday, 8th April 2024, participants will compete to showcase their best application of IF in measuring the environmental impacts of software. 
> 
> Carbon Hack is a dynamic competition that combines healthy rivalry with collaborative innovation. Hackers will push the limits of the framework, uncover potential weaknesses, and create innovations to enhance the tool.
> 
> CarbonHack is open to all, including software practitioners and those with a passion for Green Software.
>
> Find out more about CarbonHack 2024 on the [CarbonHack website](https://grnsft.org/hack/github). Check out the [FAQ on GitHub](https://github.com/Green-Software-Foundation/hack/blob/main/FAQ.md).
> 
> Registration opens 15th January!
----------------------------


# Impact Framework


> [!IMPORTANT]
> Incubation Project: This project is an incubation project being run inside the Green Software Foundation; as such, we DON’T recommend using it in any critical use case. Incubation projects are experimental, offer no support guarantee, have minimal governance and process, and may be retired at any moment. This project may one day Graduate, in which case this disclaimer will be removed.

[Impact Framework](https://greensoftwarefoundation.atlassian.net/wiki/spaces/~612dd45e45cd76006a84071a/pages/17072136/Opensource+Impact+Engine+Framework) (IF) is an [Incubation](https://oc.greensoftware.foundation/project-lifecycle.html#incubation) project from the [Open Source Working Group](https://greensoftwarefoundation.atlassian.net/wiki/spaces/~612dd45e45cd76006a84071a/pages/852049/Open+Source+Working+Group) in the [Green Software Foundation](https://greensoftware.foundation/).


**Our documentation is online at [if.greensoftware.foundation]([if.greensoftware.foundation](https://if.greensoftware.foundation/))**


**IF** is a framework to **M**odel, **M**easure, si**M**ulate and **M**onitor the environmental impacts of software

Modern applications are composed of many smaller pieces of software (components) running on many different environments, for example, private cloud, public cloud, bare-metal, virtualized, containerized, mobile, laptops, and desktops.

Every environment requires a different model of measurement, and there is no single solution you can use to calculate the environmental impacts for all components across all environments.      

The friction to measuring software emissions isn't that we need to know how, it's that we run software on many things and each thing has several different ways to measure.

Read the [specification and design docs](https://if.greensoftware.foundation) to begin.


## Get started

The first thing to understand is that IF is a framework for running model plugins. This means that in order to do some calculations, you need to load some models from some external resource. We provide a [standard library of models](https://github.com/Green-Software-Foundation/if-models) and a repository of [community models](https://github.com/Green-Software-Foundation/if-unofficial-models) to get you started. 

Start by installing framework itself:

```sh
npm install -g "@grnsft/if"
```
Then installing some models:

```sh
npm install -g "@grnsft/if-models"
```

Then create an `impl` file that describes your application (see our docs for a detailed explanation).

Then, run `impact-engine` using the following command:

```sh
impact-engine --impl <path-to-your-impl-file>
```

You can also add an optional savepath for your output yaml (if you do not provide one, the output will be printed to the console):

```sh
impact-engine --impl <path-to-your-impl-file> --ompl <your-savepath>
```

The `impact-engine` CLI tool will configure and run the models defined in your input `yaml` (`impl`) and return the results as an output `yaml` (`ompl`).


## Documentation

Please read our documentation at [if.greensoftware.foundation](https://if.greensoftware.foundation/)

## Video walk-through

Watch this video to learn how to create and run an `impl`.

[![Watch the walk-through video](https://i3.ytimg.com/vi/R-6eDM8AsvY/maxresdefault.jpg)](https://youtu.be/GW37Qd4AQbU)


## Contributing

To contribute to IF, please fork this repository and raise a pull request from your fork. 

You can check our issue board for issues tagged `help-wanted`. These are issues that are not currently, actively being worked on by the core team but are well-scoped enough for someone to pick up. We recommend commenting on the issue to start a chat with the core team, then start working on the issue when you have been assigned to it. This process helps to ensure your work is aligned with our roadmap and makes it much more likely that your changes will get merged compared to unsolicited PRs.

Please read the full contribution guidelines at [if.greensoftware.foundation](https://if.greensoftware.foundation/Contributing)

The same guidelines also apply to `if-docs`, `if-models` and `if-unofficial-models`.
