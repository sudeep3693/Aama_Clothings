/* eslint-disable no-unused-vars */
import React from "react";
import Hero from "../components/Hero";
import FestiveOfferSection from "../components/FestiveOfferSection";
import CategoryShowcase from "../components/CategoryShowcase";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";

const Home = () => {
  return (
    <div>
      <Hero />
      <FestiveOfferSection />
      <CategoryShowcase />
      <OurPolicy />
      <NewsletterBox />
    </div>
  );
};

export default Home;
