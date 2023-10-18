import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { StripeProvider, useStripe } from "@stripe/react-stripe-js";
import { axios } from "axios";

const DonationForm = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [valor, setValor] = useState(0);
  const [cartao, setCartao] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [cvc, setCvc] = useState("");

  const {
    values,
    errors,
    onSubmit,
  } = useForm({
    initialValues: {
      nome,
      email,
      valor,
      cartao,
      vencimento,
      cvc,
    },
  });

  const [stripe, setStripe] = useState();

  useEffect(() => {
    const stripe = new Stripe(process.env.REACT_APP_STRIPE_KEY);
    setStripe(stripe);
  }, []);

  const handleSubmit = async () => {
    const { nome, email, valor, cartao, vencimento, cvc } = values;

    // Cria um token do Stripe
    const stripeCard = new stripe.Card({
      number: cartao,
      expMonth: vencimento.split("/")[0],
      expYear: vencimento.split("/")[1],
      cvc: cvc,
    });

    // Cria uma inscrição no Stripe
    const token = await stripeCard.createToken();

    // Criptografa os dados do cartão
    const encryptedData = await stripe.crypto.encrypt(token);

    // Envia os dados criptografados para o backend
    const response = await axios.post("http://localhost:3333/donations", encryptedData);

    // Verifica o status da resposta
    if (response.status === 201) {
      // A doação foi criada com sucesso
      alert("Doação realizada com sucesso!");
    } else {
      // A doação não foi criada com sucesso
      alert("Ocorreu um erro ao criar a doação.");
    }
  };

  return (
    <StripeProvider stripe={stripe}>
      <form onSubmit={onSubmit}>
        <input type="text" name="nome" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input type="email" name="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="number" name="valor" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
        <input type="text" name="cartao" placeholder="Número do cartão" value={cartao} onChange={(e) => setCartao(e.target.value)} />
        <input type="text" name="vencimento" placeholder="Mês/Ano de vencimento" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
        <input type="text" name="cvc" placeholder="CVV" value={cvc} onChange={(e) => setCvc(e.target.value)} />
        <button type="submit">Doar</button>
      </form>
    </StripeProvider>
  );
};

export default DonationForm;
