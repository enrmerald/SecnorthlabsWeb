---
title: "ENS categories: basic, medium and high explained simply"
titleSeo: "ENS categories: basic, medium and high explained"
subtitle: "A clear guide to what it means for a system to be basic, medium or high category under the ENS, and why getting the categorisation wrong can complicate the whole compliance process."
description: "ENS categories determine the level of requirement an information system has to meet. This article explains what the basic, medium and high categories are, how they are calculated, what they mean for the company and how to avoid common mistakes when starting a compliance project."
descriptionSeo: "Learn about the ENS categories — basic, medium and high — how they are determined, what they involve and which mistakes to avoid."
date: 2026-05-29T13:00:00.000Z
category: cumplimiento
tags: [ens, compliance, grc, ciberseguridad, nis2, iso-27001]
image: blog-categorias-del-ens
author: ISN Labs
originalUrl: https://ewala.es/blog/posts/categorias-del-ens/
---

## ENS categories: basic, medium and high — a practical guide

One of the points that raises the most questions when an organisation starts working with the **National Security Framework (ENS)** is system categorisation.

That is understandable, because many companies think the ENS applies to the whole organisation in a general way, as if you had to attach a single label to it. It does not work like that.

The ENS does not categorise companies. **It categorises information systems.**

The same organisation can have several systems in different categories. A corporate website may face a lower requirement than a SaaS platform used by a public administration, or than a system handling sensitive citizen information.

Understanding this is key, because the system's category shapes everything else: the applicable security measures, the documentation required, the type of conformity assessment and, in many cases, the cost of the project.

If you still need an overview of the framework, you can first read our article on [what the ENS is and why it is mandatory in Spain](/en/blog/que-es-el-ens/).

## What ENS categories are

ENS categories are the levels that determine the security requirement an information system has to meet.

There are three:

- **Basic category**
- **Medium category**
- **High category**

The category depends on the impact a security incident would have on the system.

The greater the potential damage, the higher the category and the more demanding the measures that have to be implemented.

## The five security dimensions

To determine that impact, the ENS assesses five security dimensions:

- **Confidentiality [C]**: that information is only accessible to those authorised.
- **Integrity [I]**: that information is not modified improperly.
- **Availability [D]**: that services and information are accessible when needed.
- **Authenticity [A]**: that the identity of whoever accesses or generates information can be verified.
- **Traceability [T]**: that it is possible to trace who did what, and when.

Each dimension is rated with an impact level: **LOW**, **MEDIUM** or **HIGH**.

The system's final category is determined by the highest level reached in any of the five dimensions.

| C | I | D | A | T | Resulting category |
|---|---|---|---|---|---|
| LOW | LOW | LOW | LOW | LOW | BASIC |
| LOW | MEDIUM | LOW | LOW | LOW | MEDIUM |
| MEDIUM | MEDIUM | HIGH | MEDIUM | MEDIUM | HIGH |
| LOW | LOW | HIGH | LOW | MEDIUM | HIGH |

A single dimension reaching **HIGH** is enough for the system to be high category.

A frequent mistake is to focus on confidentiality and forget that availability can raise the category on its own: if a system stops working and that causes serious impact, it is already high category.

## Who determines the category

Categorisation is not a unilateral decision by the technical team.

Under **Royal Decree 311/2022**, several roles are involved:

- **The information owner**, who determines the requirements of the information being processed.
- **The service owner**, who determines the requirements of the services provided.
- **The security officer**, who validates that the resulting categorisation is coherent and oversees the measures derived from it.

Documenting and justifying the decision is mandatory.

Saying that a system is basic, medium or high is not enough: you have to explain why, with evidence.

Guide **CCN-STIC 803** from the Spanish National Cryptologic Centre sets out the assessment criteria in detail.

## Basic category

The **basic category** applies to systems where the impact of an incident would be limited and manageable.

It may correspond, for example, to internal systems with information of low sensitivity, or to low-impact services.

### What it involves

A basic category system has to have measures such as:

- A security policy.
- Access control.
- Backups.
- Protection against malware.
- Activity logging.
- Incident management.
- Staff awareness.

The basic category is less demanding than medium or high, but it does not mean the absence of control.

The system has to be managed properly, and you have to be able to demonstrate that the applicable measures are in place.

### Conformity assessment

The basic category is demonstrated through a **Declaration of Conformity**, based on a documented self-assessment with real evidence, in line with article 38 of **Royal Decree 311/2022**.

## Medium category

The **medium category** applies when an incident could have a significant impact on the service, the information or the users affected.

It is the most common category among companies providing technology services to public administration: SaaS providers, consultancies and organisations handling information linked to public contracts.

### What it involves

A medium category system requires more structured security management.

At this level, measures that become particularly important include:

- Formal risk management.
- Defined roles and responsibilities.
- Change control.
- Vulnerability management.
- Monitoring.
- Supplier management.
- Continuity plans.
- Periodic audits.

At this stage many companies discover that the technical side is relatively advanced, but that they have gaps in governance and documentation.

The ENS is not only an IT project.

### Conformity assessment

The medium category requires a **Certification of Conformity** through an external audit, in line with article 38 of **Royal Decree 311/2022**.

The ordinary audit also has to be carried out at least every two years, under article 31.1.

If you want to see the full preparation process, read our article on [how to comply with the ENS step by step](/en/blog/como-adaptarse-al-ens-paso-a-paso/).

## High category

The **high category** is reserved for systems where an incident could have serious or very serious consequences.

We are talking about critical systems, essential services, high-impact information, or environments where an interruption, manipulation or leak would cause significant damage.

### What it involves

A high category system requires robust measures and very mature security management.

Some particularly relevant capabilities are:

- Continuous monitoring.
- Early detection.
- Reinforced access protection.
- Network segmentation.
- System hardening.
- Continuous vulnerability management.
- The capacity to respond to sophisticated attacks.

The organisation has to demonstrate real resilience, not just the existence of controls.

In these environments, solutions such as **SIEM**, **EDR**, **XDR** or **SOC** services can be relevant in strengthening surveillance, traceability and incident response.

You can explore those capabilities in our articles on [what a SOC is in cybersecurity](/en/blog/que-es-un-soc-en-ciberseguridad/) and [SIEM and SOAR: what they are and what they do](/en/blog/que-es-un-siem-y-para-que-sirve-y-un-soar/).

### Conformity assessment

As with the medium category, the high category requires a **Certification of Conformity** through an external audit.

The difference lies in the depth of the measures required and in the need to demonstrate operational effectiveness.

## Common mistakes when categorising

### Categorising the company instead of the system

A company is not "ENS medium".

The category is assigned to each information system independently.

The same organisation can have several systems in different categories.

### Underestimating availability

Many organisations focus on confidentiality and forget that availability can raise the category on its own.

If a system becomes unavailable and that causes serious impact, it may already be high category.

### Not documenting the decision

Without recorded justification, any audit can question the categorisation.

You have to explain which dimensions were assessed, what level was assigned to each and why.

### Not reviewing the category when the system changes

If the system takes on new data, new users, new integrations or new functionality, its category may be affected.

Categorisation is not something you do once and forget.

## How it fits with ISO 27001 and NIS2

ENS categories determine the level of protection for a specific system.

That concept has no direct equivalent in other frameworks.

**ISO 27001** does not categorise systems by level. It works with risk analysis and a Statement of Applicability where controls are selected according to the organisation's context.

**NIS2** distinguishes between essential and important entities, but that classification is based on the entity's sector and size, not on the impact across the security dimensions of a specific system.

The most efficient approach is usually to look for common ground between frameworks, reuse evidence and build an integrated compliance model.

If you want to go deeper into that comparison, read our article on [ENS vs ISO 27001: differences, requirements and which to pick](/en/blog/ens-vs-iso-27001-diferencias/).

If you are starting from scratch, our [ENS guide: when it is mandatory and how to comply](/en/blog/ens-cuando-es-obligatorio-y-como-adaptarse/) may also help.

## How to start

Before deciding whether a system is basic, medium or high, answer these questions:

- What service does the system provide, and to whom?
- Is it linked to a public administration?
- What information does it process and how sensitive is it?
- What would happen if the system became unavailable?
- What would happen if the data were modified improperly?
- What impact would an information leak have?
- What requirements appear in the contract or tender specification?

With those answers, the categorisation will be far more realistic and you will avoid mistakes from the outset.

## Frequently asked questions about ENS categories

### Which categories exist in the ENS?

There are three: **basic, medium and high**.

They are determined by assessing the potential impact of an incident across the five security dimensions: confidentiality, integrity, availability, authenticity and traceability.

### Does the category apply to the whole company?

No.

It applies to specific information systems. The same company can have systems in different categories.

### Does a basic system need security measures?

Yes.

The basic category is less demanding, but it still requires organisational, technical and operational measures.

### Does the category determine whether I need a declaration or a certification?

Yes.

The basic category is demonstrated through a **Declaration of Conformity**.

The medium and high categories require a **Certification of Conformity** through an external audit.

### Can the category change over time?

Yes, and you should review it as the system evolves.

A change in the data processed, the services provided or the integrations can alter the categorisation.

## Not sure which category applies to your system?

It is one of the most common mistakes: categorising badly from the start means implementing the wrong measures, spending resources poorly and exposing yourself to problems in the audit.

At **ISN Labs** we help organisations identify which systems are affected by the ENS, determine the right category and define a realistic roadmap.

Our approach combines GRC consultancy, technical cybersecurity and a business perspective.

If your company works with public administration, takes part in tenders or needs to know which ENS category applies to its systems, take a look at our [GRC service: governance, risk and compliance](/en/solutions/grc/).
