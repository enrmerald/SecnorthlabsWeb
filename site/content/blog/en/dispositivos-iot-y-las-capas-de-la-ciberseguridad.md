---
title: "IoT devices and the layers of cybersecurity"
titleSeo: "IoT cybersecurity: how to protect your company"
subtitle: "How IoT devices reshape IT/OT security, and why you need multiple layers of protection"
description: "The growth of IoT increases risk across IT/OT networks. We look at which security layers you need and how an NDR improves visibility and protection."
descriptionSeo: "Learn how IoT affects cybersecurity and which layers you need to protect IT/OT networks with solutions such as NDR."
date: 2025-11-07T09:18:00.000Z
category: ot
tags: [iot, ciberseguridad, ot, ndr, infraestructuras-criticas, seguridad-it, zero-trust, siem, soar, sentryn3t]
image: blog-dispositivos-iot-y-las-capas-de-la-ciberseguridad
author: ISN Labs
originalUrl: https://ewala.es/blog/posts/dispositivos-iot-y-las-capas-de-la-ciberseguridad/
---

## A more connected world: why cybersecurity is no longer optional
We tend to talk about cybersecurity in the singular, but the concept is so broad that it would be more accurate to talk about a company's different security policies and measures, in the plural.

Defending hybrid environments — where on-premise servers, cloud services, web applications, technologies that never stop evolving and industrial networks like the ones we describe in this article on **[OT systems and networks](/en/blog/sistemas-y-redes-industriales-ot/)** all live side by side — is undoubtedly a challenge in constant evolution.

## IoT in companies: small devices, big risks
Within that broad picture, monitoring IoT (Internet of Things) devices matters more and more. They are already present in most homes, but they are also present in practically every company. It matters because their presence keeps growing: there are more and more IoT devices connected to corporate networks.

We are talking about PLCs, temperature sensors, IP cameras, HVAC systems, card readers, smart shelving and RFID devices. Although we tend to associate IoT with domestic devices such as smart bulbs, plugs or voice assistants, the impact in a business environment is far greater. Corporate IoT devices usually handle sensitive data, control processes or grant physical access, and many of them never receive updates or still use default passwords. That turns every small device into a potential entry point for an attacker, even when they look harmless at first glance.

## What a genuinely secure IT/OT network would look like
From the point of view of [ISN Labs](/en/company/), which is that of a Managed Security Service Provider (MSSP), in an ideal world a company would have two fully isolated networks (IT and OT), with the IT network segmented so that IoT devices sit in their own VLAN, and an NDR deployed in OT monitoring network traffic, including that of the IoT devices on that network.

We would also have more security layers in both environments: a perimeter firewall, EDR on endpoints that have an operating system, specific email protections (anti-phishing, sandboxing, anti-malware and so on), a **SIEM+SOAR** integrating and monitoring every log generated, backups, and a security team analysing all of that information in real time.

If you want to go deeper into SIEM or SOAR, you can read our article on **[what a SIEM and a SOAR are](/en/blog/que-es-un-siem-y-para-que-sirve-y-un-soar/)**.

## The real world: shadow IT/OT and poorly segmented networks
That is the ideal. In the real world what we find are environments with more hops between networks than there should be, and where it is hard to find a network in which every device is clearly IT or clearly OT. Add to that the fact that we rarely have all the security layers we would like, that new devices are constantly being connected, and that we run into shadow zones (shadow IT/OT) — devices connected without the security team's knowledge or without proper management — and the challenge of "defending" starts to get quite complicated.

There are no magic solutions. What matters most is that company management becomes aware of the problem, and that companies start improving cybersecurity from the governance side, because the first step in defending yourself is knowing what you have to defend (an asset inventory) and how you have to defend it (a security master plan) — and, very importantly, being aware of the investment that entails.

## NDR: the missing layer for understanding what happens on your network
We started with IoT devices, moved on to corporate networks and protective measures, and we want to finish by focusing on **NDR (Network Detection and Response)**.

An [NDR](/en/blog/ndr-en-ot/) is a solution that continuously monitors network traffic (east-west and north-south) to identify anomalous behaviour, intrusions or an attacker's lateral movement. Unlike traditional signature-based detection systems (such as an IDS/IPS), an NDR relies mainly on behavioural analysis, artificial intelligence and machine learning to detect unknown or advanced attacks.

### A simple way to understand an NDR
A good way to think about it is as a surveillance camera watching how the devices on the network behave. It does not work from fixed rules, but from learning what "normal" is and flagging anything that deviates from that pattern. Unlike a firewall, which controls what comes in or goes out, an NDR analyses what happens inside the network to detect unusual movement, even when it looks nothing like a known attack.

As we said, it is one more layer of security, traditionally with greater adoption in OT, where it is hard to see what numerous legacy devices — often without an operating system — are actually doing. The best option there is to analyse how they communicate with the rest of the network.

But the reality today is that IT has plenty of devices of that kind too, so NDR is becoming a necessity in those environments as well.

## The NDR we integrate: SentryN3t
At [ISN Labs](/en/company/) we have spent several years listening to the market, and the NDR we deploy and manage is **SentryN3t**, technology from our partner Ewala.

We said that knowing what to protect matters, which is why the NDR first performs **continuous asset discovery**.

We have seen that OT environments often have no IT technicians on site, so the console can be operated in a user-friendly way by technicians at industrial plants, logistics warehouses and similar.

We know security teams already have many data sources to analyse, so the solution can integrate with practically any security console.

You cannot protect your company with an NDR alone, but adding one to your security stack will considerably increase visibility over your network and your assets, and it complements any other solution you already have deployed. We strongly encourage you to look into these solutions because, as we said at the start, this business is a challenge in constant evolution, and exploring new options is always necessary to maintain or improve any company's level of security.

Incidentally, the NDR we manage is called **SentryN3t**, it is a trademark of Ewala and it is developed entirely within the European Union, specifically in Asturias, Spain.

## IoT will keep growing, and so should your security
Many companies today already have more IoT devices connected than traditional computers, which makes protecting this hybrid ecosystem an urgent need. Adding technologies such as NDR does not only improve network visibility: it helps prioritise real risk and act before an incident reaches operations.

For more information, or to see how it works on your network, request a demo or [get in touch](/en/contact/) with no strings attached.
