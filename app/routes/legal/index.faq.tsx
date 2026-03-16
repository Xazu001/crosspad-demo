import { useState } from "react";

import { flow } from "#/components/custom/animations/flow";
import { Icon } from "#/components/ui/icon";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
}

function FAQItem({ question, answer, isOpen, onToggle, delay }: FAQItemProps) {
  return (
    <flow.div delay={delay} className="faq__item" distance={0}>
      <button className="faq__question" onClick={onToggle}>
        <h3 className="faq__question-text">{question}</h3>
        <Icon.ChevronDown className={`faq__icon ${isOpen ? "faq__icon--open" : ""}`} />
      </button>
      <div className={`faq__answer ${isOpen ? "faq__answer--open" : ""}`}>
        <p className="faq__answer-text">{answer}</p>
      </div>
    </flow.div>
  );
}

export function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const faqData = [
    {
      question: "What is Crosspad?",
      answer:
        "Crosspad is a web-based launchpad platform that allows you to create and play music using your keyboard, MIDI devices, or mobile touch interface.",
    },
    {
      question: "Do I need to install anything?",
      answer:
        "No! Crosspad runs entirely in your web browser. There's no software to download or install. Simply visit our website, and you can start playing music right now.",
    },
    {
      question: "What devices can I use with Crosspad?",
      answer:
        "Crosspad supports multiple input methods: your computer keyboard (using keys to trigger pads), MIDI controllers, mobile devices for on-the-go music experience.",
    },
    {
      question: "Is Crosspad free to use?",
      answer:
        "Yes! Crosspad offers a free tier with all the essential features you need to start playing music.",
    },
    {
      question: "Can I use my own sounds and samples?",
      answer:
        "Currently, Crosspad only provides a curated library of high-quality kits and sounds with no way to upload your own. We plan to add this feature in the future.",
    },
    {
      question: "How do I connect my MIDI device?",
      answer:
        "Simply connect your MIDI device to your computer via USB or MIDI interface. Crosspad will automatically detect your MIDI device and map it to the virtual pads.",
    },
  ];

  return (
    <section id="faq" className="faq">
      <flow.container className="faq__container" stagger={0.1} threshold={0.1}>
        <flow.h2 delay={0.1} className="faq__title">
          Frequently Asked Questions
        </flow.h2>
        <flow.p delay={0.2} className="faq__description">
          Everything you need to know about Crosspad and how to get started with making music.
        </flow.p>

        <div className="faq__items">
          {faqData.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openItems.has(index)}
              onToggle={() => toggleItem(index)}
              delay={0.15}
            />
          ))}
        </div>
      </flow.container>
    </section>
  );
}
